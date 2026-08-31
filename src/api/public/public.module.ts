import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PublicMediaController } from './media/public-media.controller';
import { PublicProductsController } from './products/public-products.controller';
import { PublicProductsService } from './products/public-products.service';
import { PublicCategoriesModule } from './categories/public-categories.module';
import { PublicReviewsModule } from './reviews/public-reviews.module';
import { PublicBrandsModule } from './brands/public-brands.module';
import { PublicSiteSettingsModule } from './site-settings/public-site-settings.module';
import { PublicCollectionsModule } from './collections/public-collections.module';
import { PublicBannersModule } from './banners/public-banners.module';
import { PublicContactModule } from './contact/public-contact.module';

@Module({
  imports: [
    PrismaModule,
    PublicCategoriesModule,
    PublicReviewsModule,
    PublicBrandsModule,
    PublicSiteSettingsModule,
    PublicCollectionsModule,
    PublicBannersModule,
    PublicContactModule,
  ],
  controllers: [PublicMediaController, PublicProductsController],
  providers: [PublicProductsService],
})
export class PublicModule {}
