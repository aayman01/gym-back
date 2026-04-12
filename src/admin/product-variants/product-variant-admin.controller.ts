import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductVariantAdminService } from './product-variant-admin.service';
import { PaginatedSearchQueryDto } from '../../common/dto/paginated-search-query.dto';
import { VariantIdParamDto } from './dto/variant-id-param.dto';
import { sendResponse } from '../../common/helpers/send.reponse';

@Controller('admin/product-variants')
export class ProductVariantAdminController {
  constructor(
    private readonly productVariantAdminService: ProductVariantAdminService,
  ) {}

  @Get()
  async findAll(@Query() query: PaginatedSearchQueryDto) {
    const data = await this.productVariantAdminService.findAll(query);
    return sendResponse({
      success: true,
      message: 'Variants retrieved successfully',
      data,
    });
  }

  @Get(':variantId')
  async findOne(@Param() params: VariantIdParamDto) {
    const data = await this.productVariantAdminService.findOne(
      params.variantId,
    );
    return sendResponse({
      success: true,
      message: 'Variant retrieved successfully',
      data,
    });
  }
}
