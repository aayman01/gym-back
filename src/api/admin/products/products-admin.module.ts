import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminMediaModule } from '../media/admin-media.module';
import { ProductsAdminController } from './products-admin.controller';
import { ProductsAdminService } from './products-admin.service';

@Module({
  imports: [PrismaModule, AdminMediaModule],
  controllers: [ProductsAdminController],
  providers: [ProductsAdminService],
  exports: [ProductsAdminService],
})
export class ProductsAdminModule {}
