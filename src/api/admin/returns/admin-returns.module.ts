import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminReturnsController } from './admin-returns.controller';
import { AdminReturnsService } from './admin-returns.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminReturnsController],
  providers: [AdminReturnsService],
})
export class AdminReturnsModule {}
