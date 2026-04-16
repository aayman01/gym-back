import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

type GuestRequest = Request & { guestToken?: string };

export const GuestToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<GuestRequest>();
    return request.guestToken;
  },
);
