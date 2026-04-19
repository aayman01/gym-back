import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '../../config/app_config/app_config.service';

const PUBLIC_AUTH_PATH_FRAGMENTS = [
  'admin/auth/login',
  'admin/auth/register',
  'admin/auth/refresh',
  'admin/auth/logout',
  'user/auth/login',
  'user/auth/register',
  'user/auth/refresh',
  'user/auth/logout',
] as const;

@Injectable()
export class AdminCsrfGuard implements CanActivate {
  constructor(private readonly configService: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.configService.nodeEnv === 'development') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(method)) {
      return true;
    }

    const url = request.originalUrl ?? request.url;
    if (
      PUBLIC_AUTH_PATH_FRAGMENTS.some((fragment) => url.includes(fragment))
    ) {
      return true;
    }

    const csrfCookie = request.cookies?.['XSRF-TOKEN'];
    const csrfHeader = request.headers['x-xsrf-token'];

    if (!csrfCookie) {
      throw new ForbiddenException('CSRF cookie missing');
    }

    if (!csrfHeader) {
      throw new ForbiddenException('CSRF header missing');
    }

    if (csrfCookie !== csrfHeader) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }
}
