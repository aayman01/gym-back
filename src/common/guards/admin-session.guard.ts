import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../constants/auth.constants';
import { AdminSessionService } from '../../api/admin/auth/admin-session.service';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionService: AdminSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = request.cookies?.admin_access_token;

    if (!accessToken) {
      throw new UnauthorizedException('No access token found');
    }

    const admin = await this.sessionService.validateSession(accessToken);
    if (!admin) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    (request as Request & { admin: typeof admin }).admin = admin;

    return true;
  }
}
