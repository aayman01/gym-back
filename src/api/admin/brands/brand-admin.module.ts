import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { BrandAdminController } from './brand-admin.controller';
import { BrandAdminService } from './brand-admin.service';
import { BrandRepository } from './brand.repository';

@Module({
  imports: [PrismaModule],
  controllers: [BrandAdminController],
  providers: [BrandAdminService, BrandRepository],
  exports: [BrandAdminService, BrandRepository],
})
export class BrandAdminModule {}
