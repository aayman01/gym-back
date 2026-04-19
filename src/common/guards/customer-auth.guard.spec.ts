import { UnauthorizedException } from '@nestjs/common';
import { CustomerSessionService } from '../../api/user/auth/customer-session.service';
import { CustomerAuthGuard } from './customer-auth.guard';

describe('CustomerAuthGuard', () => {
  it('throws when no bearer or cookie token is present', async () => {
    const session = {
      validateAccessToken: jest.fn(),
    };
    const guard = new CustomerAuthGuard(
      session as unknown as CustomerSessionService,
    );
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          cookies: {},
        }),
      }),
    };

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(session.validateAccessToken).not.toHaveBeenCalled();
  });
});
