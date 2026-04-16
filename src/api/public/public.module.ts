import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PublicMediaController } from './media/public-media.controller';
import { PublicProductsController } from './products/public-products.controller';
import { PublicProductsService } from './products/public-products.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicMediaController, PublicProductsController],
  providers: [PublicProductsService],
})
export class PublicModule {}
