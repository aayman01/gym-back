import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ShippingMethodAdminController } from './shipping-method-admin.controller';
import { ShippingMethodAdminService } from './shipping-method-admin.service';
import { ShippingMethodRepository } from './shipping-method.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ShippingMethodAdminController],
  providers: [ShippingMethodAdminService, ShippingMethodRepository],
  exports: [ShippingMethodAdminService, ShippingMethodRepository],
})
export class ShippingMethodAdminModule {}
