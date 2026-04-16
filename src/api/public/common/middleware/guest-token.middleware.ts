import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

const GUEST_TOKEN_COOKIE = 'guestToken';
const GUEST_TOKEN_HEADER = 'x-guest-token';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type GuestRequest = Request & { guestToken?: string };

@Injectable()
export class GuestTokenMiddleware implements NestMiddleware {
  use(req: GuestRequest, res: Response, next: NextFunction): void {
    const headerToken = req.headers[GUEST_TOKEN_HEADER] as string | undefined;
    const cookieToken = req.cookies?.[GUEST_TOKEN_COOKIE] as string | undefined;
    const incomingToken = (headerToken || cookieToken || '').trim();
    const guestToken = incomingToken || randomUUID();

    req.guestToken = guestToken;

    if (!incomingToken) {
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie(GUEST_TOKEN_COOKIE, guestToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: THIRTY_DAYS_MS,
      });
    }

    next();
  }
}
