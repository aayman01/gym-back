import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { AdminRepository } from './admin.repository';
import { AdminSessionService } from './admin-session.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { AdminSessionData } from './types/admin-session.types';

const scryptAsync = promisify(scrypt);

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly sessionService: AdminSessionService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  }

  async comparePasswords(password: string, storedHash: string): Promise<boolean> {
    const [hash, salt] = storedHash.split('.');
    if (!hash || !salt) {
      return false;
    }
    const hashBuf = Buffer.from(hash, 'hex');
    const verifyBuf = (await scryptAsync(password, salt, 64)) as Buffer;
    if (hashBuf.length !== verifyBuf.length) {
      return false;
    }
    return timingSafeEqual(hashBuf, verifyBuf);
  }

  async register(dto: RegisterDto) {
    const existing = await this.adminRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await this.hashPassword(dto.password);
    const admin = await this.adminRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
    });

    return {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
    };
  }

  async login(dto: LoginDto) {
    const admin = await this.adminRepository.findByEmail(dto.email);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await this.comparePasswords(dto.password, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = await this.sessionService.createSession(admin.id);
    const tokens = this.sessionService.generateTokens(session.id);

    return {
      ...tokens,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      } satisfies AdminSessionData,
    };
  }

  async validateSession(accessToken: string) {
    return this.sessionService.validateSession(accessToken);
  }

  async refreshTokens(refreshToken: string) {
    return this.sessionService.refreshTokens(refreshToken);
  }

  async logout(accessToken: string) {
    return this.sessionService.logout(accessToken);
  }

  generateCsrfToken(): string {
    return this.sessionService.generateCsrfToken();
  }
}
