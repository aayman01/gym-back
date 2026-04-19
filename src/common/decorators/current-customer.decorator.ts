import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { CustomerSessionData } from '../../api/user/auth/types/customer-session.types';
import { CUSTOMER_REQUEST_KEY } from '../guards/customer-auth.guard';

export const CurrentCustomer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CustomerSessionData => {
    const request = ctx.switchToHttp().getRequest();
    const customer = request[CUSTOMER_REQUEST_KEY] as
      | CustomerSessionData
      | undefined;

    if (!customer) {
      throw new UnauthorizedException('Customer not authenticated');
    }

    return customer;
  },
);
