import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { AdminInventoryService } from './admin-inventory.service';
import { GetInventoryQueryDto } from './dto/get-inventory-query.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { VariantIdInventoryParamDto } from './dto/variant-id-inventory-param.dto';

@Controller('admin/inventory')
export class AdminInventoryController {
  constructor(private readonly adminInventoryService: AdminInventoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: GetInventoryQueryDto) {
    const data = await this.adminInventoryService.findAll(query);
    return sendResponse({ success: true, message: 'Inventory retrieved', data });
  }

  @Get(':variantId/transactions')
  @HttpCode(HttpStatus.OK)
  async getTransactions(@Param() param: VariantIdInventoryParamDto) {
    const data = await this.adminInventoryService.getTransactions(param.variantId);
    return sendResponse({
      success: true,
      message: 'Transactions retrieved',
      data,
    });
  }

  @Post(':variantId/adjust')
  @HttpCode(HttpStatus.OK)
  async adjust(
    @Param() param: VariantIdInventoryParamDto,
    @Body() dto: AdjustInventoryDto,
  ) {
    const data = await this.adminInventoryService.adjust(param.variantId, dto);
    return sendResponse({
      success: true,
      message: 'Inventory adjusted',
      data,
    });
  }
}
