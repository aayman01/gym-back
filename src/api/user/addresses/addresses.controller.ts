import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { Public } from '@common/decorators/public.decorator';
import { CurrentCustomer } from '@common/decorators/current-customer.decorator';
import { CustomerAuthGuard } from '@common/guards/customer-auth.guard';
import type { CustomerSessionData } from '../auth/types/customer-session.types';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { AddressParamDto } from './dto/address-param.dto';

@Public()
@UseGuards(CustomerAuthGuard)
@Controller('user/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@CurrentCustomer() customer: CustomerSessionData) {
    const data = await this.addressesService.list(customer.id);
    return sendResponse({ success: true, message: 'Addresses retrieved', data });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentCustomer() customer: CustomerSessionData,
    @Body() dto: CreateAddressDto,
  ) {
    const data = await this.addressesService.create(customer.id, dto);
    return sendResponse({ success: true, message: 'Address created', data });
  }

  @Patch(':addressId')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentCustomer() customer: CustomerSessionData,
    @Param() param: AddressParamDto,
    @Body() dto: UpdateAddressDto,
  ) {
    const data = await this.addressesService.update(
      customer.id,
      param.addressId,
      dto,
    );
    return sendResponse({ success: true, message: 'Address updated', data });
  }

  @Delete(':addressId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentCustomer() customer: CustomerSessionData,
    @Param() param: AddressParamDto,
  ) {
    const data = await this.addressesService.remove(
      customer.id,
      param.addressId,
    );
    return sendResponse({ success: true, message: 'Address deleted', data });
  }

  @Post(':addressId/default')
  @HttpCode(HttpStatus.OK)
  async setDefault(
    @CurrentCustomer() customer: CustomerSessionData,
    @Param() param: AddressParamDto,
  ) {
    const data = await this.addressesService.setDefault(
      customer.id,
      param.addressId,
    );
    return sendResponse({
      success: true,
      message: 'Default address set',
      data,
    });
  }
}
