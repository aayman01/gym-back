import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { AdminOrdersService } from './admin-orders.service';
import { GetAdminOrdersQueryDto } from './dto/get-admin-orders-query.dto';
import { AdminOrderIdParamDto } from './dto/admin-order-id-param.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: GetAdminOrdersQueryDto) {
    const data = await this.adminOrdersService.findAll(query);
    return sendResponse({
      success: true,
      message: 'Orders retrieved',
      data,
    });
  }

  @Get(':orderId')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: AdminOrderIdParamDto) {
    const data = await this.adminOrdersService.findOne(param.orderId);
    return sendResponse({
      success: true,
      message: 'Order retrieved',
      data,
    });
  }

  @Patch(':orderId/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param() param: AdminOrderIdParamDto,
    @Body() body: UpdateOrderStatusDto,
  ) {
    const data = await this.adminOrdersService.updateStatus(
      param.orderId,
      body.status,
    );
    return sendResponse({
      success: true,
      message: 'Order status updated',
      data,
    });
  }
}
