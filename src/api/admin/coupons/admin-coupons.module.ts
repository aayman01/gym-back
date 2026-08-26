import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminCouponsController } from './admin-coupons.controller';
import { AdminCouponsService } from './admin-coupons.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminCouponsController],
  providers: [AdminCouponsService],
})
export class AdminCouponsModule {}
