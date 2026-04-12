import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ProductAttributeAdminController } from './product-attribute-admin.controller';
import { ProductAttributeAdminService } from './product-attribute-admin.service';
import { ProductAttributeRepository } from './product-attribute.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ProductAttributeAdminController],
  providers: [ProductAttributeAdminService, ProductAttributeRepository],
  exports: [ProductAttributeAdminService, ProductAttributeRepository],
})
export class ProductAttributeAdminModule {}
