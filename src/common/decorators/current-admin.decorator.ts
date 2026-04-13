import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AdminSessionData } from '../../api/admin/auth/types/admin-session.types';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminSessionData => {
    const request = ctx.switchToHttp().getRequest();
    const admin = request.admin as AdminSessionData | undefined;

    if (!admin) {
      throw new UnauthorizedException('Admin not authenticated');
    }

    return admin;
  },
);
