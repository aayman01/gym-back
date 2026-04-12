import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductVariantAdminController } from './product-variant-admin.controller';
import { ProductVariantAdminService } from './product-variant-admin.service';
import { ProductVariantRepository } from './product-variant.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ProductVariantAdminController],
  providers: [ProductVariantAdminService, ProductVariantRepository],
  exports: [ProductVariantAdminService, ProductVariantRepository],
})
export class ProductVariantAdminModule {}
