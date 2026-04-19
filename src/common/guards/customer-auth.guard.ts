import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CustomerSessionService } from '../../api/user/auth/customer-session.service';
import type { CustomerSessionData } from '../../api/user/auth/types/customer-session.types';

export const CUSTOMER_REQUEST_KEY = 'customer' as const;

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private readonly customerSessionService: CustomerSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const bearer = request.headers.authorization;
    let token: string | undefined;

    if (typeof bearer === 'string' && bearer.startsWith('Bearer ')) {
      token = bearer.slice('Bearer '.length).trim();
    } else {
      token = request.cookies?.customer_access_token as string | undefined;
    }

    if (!token) {
      throw new UnauthorizedException('Customer not authenticated');
    }

    const customer =
      await this.customerSessionService.validateAccessToken(token);
    if (!customer) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    (request as Request & { [CUSTOMER_REQUEST_KEY]: CustomerSessionData })[
      CUSTOMER_REQUEST_KEY
    ] = customer;

    return true;
  }
}
