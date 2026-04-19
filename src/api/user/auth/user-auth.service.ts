import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { CustomerRepository } from './customer.repository';
import { CustomerSessionService } from './customer-session.service';
import { PublicRegisterDto } from './dto/register.dto';
import { PublicLoginDto } from './dto/login.dto';
import type { CustomerSessionData } from './types/customer-session.types';

const scryptAsync = promisify(scrypt);

@Injectable()
export class UserAuthService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly sessionService: CustomerSessionService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  }

  async comparePasswords(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
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

  async register(dto: PublicRegisterDto) {
    const existing = await this.customerRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await this.hashPassword(dto.password);
    const user = await this.customerRepository.create({
      email: dto.email,
      passwordHash: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async login(dto: PublicLoginDto) {
    const user = await this.customerRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isMatch = await this.comparePasswords(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.sessionService.generateTokens(user.id);

    return {
      ...tokens,
      customer: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      } satisfies CustomerSessionData,
    };
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
