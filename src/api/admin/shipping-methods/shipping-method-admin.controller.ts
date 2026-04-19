import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ShippingMethodAdminService } from './shipping-method-admin.service';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';
import { GetShippingMethodsQueryDto } from './dto/get-shipping-methods-query.dto';
import { ShippingMethodIdParamDto } from './dto/shipping-method-id-param.dto';
import { sendResponse } from '@common/helpers/send.response';

@Controller('admin/shipping-methods')
export class ShippingMethodAdminController {
  constructor(
    private readonly shippingMethodAdminService: ShippingMethodAdminService,
  ) {}

  @Post()
  async create(@Body() body: CreateShippingMethodDto) {
    const data = await this.shippingMethodAdminService.create(body);
    return sendResponse({
      success: true,
      message: 'Shipping method created successfully',
      data,
    });
  }

  @Get()
  async findAll(@Query() query: GetShippingMethodsQueryDto) {
    const data = await this.shippingMethodAdminService.findAll(query);
    return sendResponse({
      success: true,
      message: 'Shipping methods retrieved successfully',
      data,
    });
  }

  @Patch(':shippingMethodId/activate')
  async activate(@Param() param: ShippingMethodIdParamDto) {
    const data = await this.shippingMethodAdminService.activate(
      param.shippingMethodId,
    );
    return sendResponse({
      success: true,
      message: 'Shipping method activated successfully',
      data,
    });
  }

  @Patch(':shippingMethodId/deactivate')
  async deactivate(@Param() param: ShippingMethodIdParamDto) {
    const data = await this.shippingMethodAdminService.deactivate(
      param.shippingMethodId,
    );
    return sendResponse({
      success: true,
      message: 'Shipping method deactivated successfully',
      data,
    });
  }

  @Get(':shippingMethodId')
  async findOne(@Param() param: ShippingMethodIdParamDto) {
    const data = await this.shippingMethodAdminService.findOne(
      param.shippingMethodId,
    );
    return sendResponse({
      success: true,
      message: 'Shipping method retrieved successfully',
      data,
    });
  }

  @Patch(':shippingMethodId')
  async update(
    @Param() param: ShippingMethodIdParamDto,
    @Body() body: UpdateShippingMethodDto,
  ) {
    const data = await this.shippingMethodAdminService.update(
      param.shippingMethodId,
      body,
    );
    return sendResponse({
      success: true,
      message: 'Shipping method updated successfully',
      data,
    });
  }

  @Delete(':shippingMethodId')
  async remove(@Param() param: ShippingMethodIdParamDto) {
    const data = await this.shippingMethodAdminService.remove(
      param.shippingMethodId,
    );
    return sendResponse({
      success: true,
      message: 'Shipping method deleted successfully',
      data,
    });
  }
}
