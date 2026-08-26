import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminCollectionsController } from './admin-collections.controller';
import { AdminCollectionsService } from './admin-collections.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminCollectionsController],
  providers: [AdminCollectionsService],
})
export class AdminCollectionsModule {}
