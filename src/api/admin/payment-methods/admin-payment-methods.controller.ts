import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PrismaService } from '../../../prisma/prisma.service';

const idSchema = z.object({ paymentMethodId: z.string().uuid() });
class PaymentMethodIdParamDto extends createZodDto(idSchema) {}

const updateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
  imageUrl: z.string().url().max(500).optional().nullable(),
});
class UpdatePaymentMethodDto extends createZodDto(updateSchema) {}

@Controller('admin/payment-methods')
export class AdminPaymentMethodsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const data = await this.prisma.paymentMethod.findMany({
      orderBy: { order: 'asc' },
    });
    return sendResponse({ success: true, message: 'Payment methods retrieved', data });
  }

  @Patch(':paymentMethodId')
  async update(
    @Param() param: PaymentMethodIdParamDto,
    @Body() body: UpdatePaymentMethodDto,
  ) {
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { id: param.paymentMethodId },
    });
    if (!existing) throw new NotFoundException('Payment method not found');
    const data = await this.prisma.paymentMethod.update({
      where: { id: param.paymentMethodId },
      data: body,
    });
    return sendResponse({ success: true, message: 'Payment method updated', data });
  }
}
