import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PublicMediaController } from './media/public-media.controller';
import { PublicProductsController } from './products/public-products.controller';
import { PublicProductsService } from './products/public-products.service';
import { PublicCategoriesModule } from './categories/public-categories.module';
import { PublicReviewsModule } from './reviews/public-reviews.module';
import { PublicBrandsModule } from './brands/public-brands.module';

@Module({
  imports: [
    PrismaModule,
    PublicCategoriesModule,
    PublicReviewsModule,
    PublicBrandsModule,
  ],
  controllers: [PublicMediaController, PublicProductsController],
  providers: [PublicProductsService],
})
export class PublicModule {}
