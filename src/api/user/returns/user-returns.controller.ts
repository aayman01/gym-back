import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { sendResponse } from '@common/helpers/send.response';
import { CurrentCustomer } from '@common/decorators/current-customer.decorator';
import { CustomerAuthGuard } from '@common/guards/customer-auth.guard';
import type { CustomerSessionData } from '../auth/types/customer-session.types';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserReturnsService } from './user-returns.service';

const createReturnSchema = z.object({
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        quantityRequested: z.number().int().positive(),
        reason: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1),
  customerReason: z.string().trim().max(2000).optional().nullable(),
  customerComment: z.string().trim().max(2000).optional().nullable(),
});
class CreateReturnDto extends createZodDto(createReturnSchema) {}

const orderIdSchema = z.object({ orderId: z.string().uuid() });
class OrderIdParamDto extends createZodDto(orderIdSchema) {}

@Public()
@Controller('user')
@UseGuards(CustomerAuthGuard)
export class UserReturnsController {
  constructor(private readonly returns: UserReturnsService) {}

  @Get('returns')
  @HttpCode(HttpStatus.OK)
  async list(@CurrentCustomer() customer: CustomerSessionData) {
    const data = await this.returns.list(customer.id);
    return sendResponse({ success: true, message: 'Returns retrieved', data });
  }

  @Post('orders/:orderId/returns')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentCustomer() customer: CustomerSessionData,
    @Param() param: OrderIdParamDto,
    @Body() dto: CreateReturnDto,
  ) {
    const data = await this.returns.create(customer.id, param.orderId, dto);
    return sendResponse({ success: true, message: 'Return requested', data });
  }
}
