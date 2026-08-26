import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AdminCustomersService } from './admin-customers.service';

const idSchema = z.object({ customerId: z.string().uuid() });
class CustomerIdParamDto extends createZodDto(idSchema) {}

const updateSchema = z.object({ isActive: z.boolean() });
class UpdateCustomerDto extends createZodDto(updateSchema) {}

@Controller('admin/customers')
export class AdminCustomersController {
  constructor(private readonly customers: AdminCustomersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: PaginatedSearchQueryDto) {
    const data = await this.customers.findAll(query);
    return sendResponse({ success: true, message: 'Customers retrieved', data });
  }

  @Get(':customerId')
  async findOne(@Param() param: CustomerIdParamDto) {
    const data = await this.customers.findOne(param.customerId);
    return sendResponse({ success: true, message: 'Customer retrieved', data });
  }

  @Patch(':customerId')
  async update(
    @Param() param: CustomerIdParamDto,
    @Body() body: UpdateCustomerDto,
  ) {
    const data = await this.customers.update(param.customerId, body.isActive);
    return sendResponse({ success: true, message: 'Customer updated', data });
  }
}
