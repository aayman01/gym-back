import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { CustomerSessionService } from '../../api/user/auth/customer-session.service';

export const CUSTOMER_ID_FROM_SESSION = 'customerIdFromSession';

type SessionRequest = Request & { [CUSTOMER_ID_FROM_SESSION]?: string };

@Injectable()
export class OptionalCustomerMiddleware implements NestMiddleware {
  constructor(private readonly sessionService: CustomerSessionService) {}

  async use(req: SessionRequest, _res: Response, next: NextFunction) {
    const token = req.cookies?.customer_access_token as string | undefined;
    if (token) {
      const customer = await this.sessionService.validateAccessToken(token);
      if (customer) {
        req[CUSTOMER_ID_FROM_SESSION] = customer.id;
      }
    }
    next();
  }
}
