import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { CUSTOMER_ID_FROM_SESSION } from '../middleware/optional-customer.middleware';

const CUSTOMER_HEADER = 'x-customer-id';

type SessionRequest = Request & { [CUSTOMER_ID_FROM_SESSION]?: string };

export const CurrentCustomerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<SessionRequest>();
    const headerId = request.headers[CUSTOMER_HEADER];
    if (typeof headerId === 'string' && headerId.trim().length > 0) {
      return headerId.trim();
    }
    return request[CUSTOMER_ID_FROM_SESSION];
  },
);
