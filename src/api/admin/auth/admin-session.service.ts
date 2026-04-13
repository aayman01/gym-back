import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { AppConfigService } from '../../../config/app_config/app_config.service';
import { AdminRepository } from './admin.repository';
import { AdminSessionRepository } from './admin-session.repository';
import type { AdminSessionData } from './types/admin-session.types';

@Injectable()
export class AdminSessionService {
  constructor(
    private readonly sessionRepository: AdminSessionRepository,
    private readonly adminRepository: AdminRepository,
    private readonly configService: AppConfigService,
  ) {}

  generateTokens(sessionId: string) {
    const accessToken = this.signToken(
      sessionId,
      this.configService.adminJwtAccessSecret,
      this.configService.adminJwtAccessExpires,
    );
    const refreshToken = this.signToken(
      sessionId,
      this.configService.adminJwtRefreshSecret,
      this.configService.adminJwtRefreshExpires,
    );

    return { accessToken, refreshToken };
  }

  private signToken(sessionId: string, secret: string, expiresIn: string): string {
    const options: SignOptions = {
      expiresIn: expiresIn as NonNullable<SignOptions['expiresIn']>,
    };
    return jwt.sign({ sessionId }, secret, options);
  }

  async createSession(adminId: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return this.sessionRepository.create(adminId, expiresAt);
  }

  async validateSession(accessToken: string): Promise<AdminSessionData | null> {
    try {
      const payload = jwt.verify(
        accessToken,
        this.configService.adminJwtAccessSecret,
      ) as { sessionId: string };

      return this.validateSessionById(payload.sessionId);
    } catch {
      return null;
    }
  }

  async validateSessionById(
    sessionId: string,
  ): Promise<AdminSessionData | null> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      await this.sessionRepository.deleteByToken(session.token);
      return null;
    }

    const admin = await this.adminRepository.findById(session.adminId);
    if (!admin) {
      await this.sessionRepository.deleteByToken(session.token);
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
      ) as { sessionId: string };

      const adminData = await this.validateSessionById(payload.sessionId);
      if (!adminData) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = this.generateTokens(payload.sessionId);

      return {
        ...tokens,
        admin: adminData,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(accessToken: string): Promise<void> {
    try {
      const payload = jwt.decode(accessToken) as { sessionId: string } | null;
      if (payload?.sessionId) {
        const session = await this.sessionRepository.findById(payload.sessionId);
        if (session) {
          await this.sessionRepository.deleteByToken(session.token);
        }
      }
    } catch {
      // ignore decode errors on logout
    }
  }

  generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
  }
}
