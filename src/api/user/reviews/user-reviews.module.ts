import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UserAuthModule } from '../auth/user-auth.module';
import { UserReviewsController } from './user-reviews.controller';
import { UserReviewsService } from './user-reviews.service';

@Module({
  imports: [PrismaModule, UserAuthModule],
  controllers: [UserReviewsController],
  providers: [UserReviewsService],
})
export class UserReviewsModule {}
