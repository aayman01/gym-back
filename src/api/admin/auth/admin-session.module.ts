import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminRepository } from './admin.repository';
import { AdminSessionService } from './admin-session.service';

@Module({
  imports: [PrismaModule],
  providers: [AdminRepository, AdminSessionService],
  exports: [AdminSessionService, AdminRepository],
})
export class AdminSessionModule {}
