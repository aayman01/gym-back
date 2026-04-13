import { Module } from '@nestjs/common';
import { AdminSessionModule } from './admin-session.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';

@Module({
  imports: [AdminSessionModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
  exports: [AdminAuthService, AdminSessionModule],
})
export class AdminAuthModule {}
