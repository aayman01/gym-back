import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

const CUSTOMER_HEADER = 'x-customer-id';

export const CurrentCustomerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const customerId = request.headers[CUSTOMER_HEADER];
    if (typeof customerId !== 'string') {
      return undefined;
    }

    const trimmed = customerId.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
);
