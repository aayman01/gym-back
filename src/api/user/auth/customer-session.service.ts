import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { AppConfigService } from '../../../config/app_config/app_config.service';
import { CustomerRepository } from './customer.repository';
import type { CustomerSessionData } from './types/customer-session.types';

@Injectable()
export class CustomerSessionService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly configService: AppConfigService,
  ) {}

  generateTokens(userId: string) {
    const accessToken = this.signToken(
      userId,
      this.configService.customerJwtAccessSecret,
      this.configService.customerJwtAccessExpires,
    );
    const refreshToken = this.signToken(
      userId,
      this.configService.customerJwtRefreshSecret,
      this.configService.customerJwtRefreshExpires,
    );

    return { accessToken, refreshToken };
  }

  private signToken(userId: string, secret: string, expiresIn: string): string {
    const options: SignOptions = {
      expiresIn: expiresIn as NonNullable<SignOptions['expiresIn']>,
    };
    return jwt.sign({ userId }, secret, options);
  }

  async validateAccessToken(
    accessToken: string,
  ): Promise<CustomerSessionData | null> {
    try {
      const payload = jwt.verify(
        accessToken,
        this.configService.customerJwtAccessSecret,
      ) as { userId: string };
      if (!payload?.userId) {
        return null;
      }
      return this.getCustomerSessionData(payload.userId);
    } catch {
      return null;
    }
  }

  private async getCustomerSessionData(
    userId: string,
  ): Promise<CustomerSessionData | null> {
    const user = await this.customerRepository.findById(userId);
    if (!user || user.role !== 'CUSTOMER' || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = jwt.verify(
        refreshToken,
        this.configService.customerJwtRefreshSecret,
      ) as { userId: string };
      if (!payload?.userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const customer = await this.getCustomerSessionData(payload.userId);
      if (!customer) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = this.generateTokens(payload.userId);

      return {
        ...tokens,
        customer,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(_accessToken: string): Promise<void> {
    // Stateless JWT: nothing server-side
  }

  generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
  }
}
