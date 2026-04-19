import { Controller, Get, HttpCode, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { Public } from '@common/decorators/public.decorator';
import { CurrentCustomer } from '@common/decorators/current-customer.decorator';
import { CustomerAuthGuard } from '@common/guards/customer-auth.guard';
import type { CustomerSessionData } from '../auth/types/customer-session.types';
import { OrdersService } from './orders.service';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { OrderIdParamDto } from './dto/order-id-param.dto';

@Controller('user/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @UseGuards(CustomerAuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async list(
    @CurrentCustomer() customer: CustomerSessionData,
    @Query() query: GetOrdersQueryDto,
  ) {
    const data = await this.ordersService.findManyForCustomer(
      customer.id,
      query,
    );
    return sendResponse({
      success: true,
      message: 'Orders retrieved',
      data,
    });
  }

  @Public()
  @UseGuards(CustomerAuthGuard)
  @Get(':orderId')
  @HttpCode(HttpStatus.OK)
  async getOne(
    @CurrentCustomer() customer: CustomerSessionData,
    @Param() param: OrderIdParamDto,
  ) {
    const data = await this.ordersService.findOneForCustomer(
      param.orderId,
      customer.id,
    );
    return sendResponse({
      success: true,
      message: 'Order retrieved',
      data,
    });
  }
}
