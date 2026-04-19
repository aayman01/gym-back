import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PublicReviewsController } from './public-reviews.controller';
import { PublicReviewsService } from './public-reviews.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicReviewsController],
  providers: [PublicReviewsService],
})
export class PublicReviewsModule {}
