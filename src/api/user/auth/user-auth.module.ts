import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AppConfigModule } from '../../../config/app_config/app_config.module';
import { CustomerAuthGuard } from '@common/guards/customer-auth.guard';
import { CustomerRepository } from './customer.repository';
import { CustomerSessionService } from './customer-session.service';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';

@Module({
  imports: [PrismaModule, AppConfigModule],
  controllers: [UserAuthController],
  providers: [
    CustomerRepository,
    CustomerSessionService,
    UserAuthService,
    CustomerAuthGuard,
  ],
  exports: [
    CustomerRepository,
    CustomerSessionService,
    UserAuthService,
    CustomerAuthGuard,
  ],
})
export class UserAuthModule {}
