import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { AppConfigService } from '../../../config/app_config/app_config.service';
import { AdminRepository } from './admin.repository';
import type { AdminSessionData } from './types/admin-session.types';

@Injectable()
export class AdminSessionService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly configService: AppConfigService,
  ) {}

  generateTokens(adminId: string) {
    const accessToken = this.signToken(
      adminId,
      this.configService.adminJwtAccessSecret,
      this.configService.adminJwtAccessExpires,
    );
    const refreshToken = this.signToken(
      adminId,
      this.configService.adminJwtRefreshSecret,
      this.configService.adminJwtRefreshExpires,
    );

    return { accessToken, refreshToken };
  }

  private signToken(
    adminId: string,
    secret: string,
    expiresIn: string,
  ): string {
    const options: SignOptions = {
      expiresIn: expiresIn as NonNullable<SignOptions['expiresIn']>,
    };
    return jwt.sign({ adminId }, secret, options);
  }

  async validateSession(accessToken: string): Promise<AdminSessionData | null> {
    try {
      const payload = jwt.verify(
        accessToken,
        this.configService.adminJwtAccessSecret,
      ) as { adminId: string };
      if (!payload?.adminId) {
        return null;
      }
      return this.getAdminSessionData(payload.adminId);
    } catch {
      return null;
    }
  }

  private async getAdminSessionData(
    adminId: string,
  ): Promise<AdminSessionData | null> {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      return null;
    }

    return {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = jwt.verify(
        refreshToken,
        this.configService.adminJwtRefreshSecret,
      ) as { adminId: string };
      if (!payload?.adminId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const adminData = await this.getAdminSessionData(payload.adminId);
      if (!adminData) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = this.generateTokens(payload.adminId);

      return {
        ...tokens,
        admin: adminData,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(accessToken: string): Promise<void> {
    // Stateless JWT sessions: nothing to delete server-side.
  }

  generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
  }
}
