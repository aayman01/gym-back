import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TaxAdminController } from './tax-admin.controller';
import { TaxAdminService } from './tax-admin.service';
import { TaxRepository } from './tax.repository';

@Module({
  imports: [PrismaModule],
  controllers: [TaxAdminController],
  providers: [TaxAdminService, TaxRepository],
  exports: [TaxAdminService, TaxRepository],
})
export class TaxAdminModule {}
