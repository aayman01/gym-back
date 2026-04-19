import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { sendResponse } from '@common/helpers/send.response';
import { PublicProductsService } from './public-products.service';
import { GetPublicProductsQueryDto } from './dto/public-products-query.dto';
import { SearchProductsQueryDto } from './dto/search-products-query.dto';
import { ProductIdentifierParamDto } from './dto/product-identifier-param.dto';

@Public()
@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly publicProductsService: PublicProductsService) {}

  @Get()
  async list(@Query() query: GetPublicProductsQueryDto) {
    const data = await this.publicProductsService.findAll(query);
    return sendResponse({
      success: true,
      message: 'Products retrieved successfully',
      data,
    });
  }

  @Get('search')
  async search(@Query() query: SearchProductsQueryDto) {
    const data = await this.publicProductsService.search(
      query.q,
      query.page,
      query.limit,
    );
    return sendResponse({
      success: true,
      message: 'Search results retrieved successfully',
      data,
    });
  }

  @Get(':identifier')
  async detail(@Param() params: ProductIdentifierParamDto) {
    const data = await this.publicProductsService.findOne(params.identifier);
    return sendResponse({
      success: true,
      message: 'Product retrieved successfully',
      data,
    });
  }
}
