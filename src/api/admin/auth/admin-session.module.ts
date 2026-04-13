import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminRepository } from './admin.repository';
import { AdminSessionRepository } from './admin-session.repository';
import { AdminSessionService } from './admin-session.service';

@Module({
  imports: [PrismaModule],
  providers: [AdminRepository, AdminSessionRepository, AdminSessionService],
  exports: [AdminSessionService, AdminRepository, AdminSessionRepository],
})
export class AdminSessionModule {}
