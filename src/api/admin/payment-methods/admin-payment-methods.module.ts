import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminPaymentMethodsController } from './admin-payment-methods.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPaymentMethodsController],
})
export class AdminPaymentMethodsModule {}
