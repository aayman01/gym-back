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
import { sendResponse } from '../../../common/helpers/send.response';
import { CurrentAdmin } from '../../../common/decorators/current-admin.decorator';
import type { AdminSessionData } from '../auth/types/admin-session.types';
import { ProductsAdminService } from './products-admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetAdminProductsQueryDto } from './dto/get-admin-products-query.dto';
import { ProductIdParamDto } from './dto/product-id-param.dto';

@Controller('admin/products')
export class ProductsAdminController {
  constructor(private readonly productsAdminService: ProductsAdminService) {}

  @Post()
  async create(
    @CurrentAdmin() admin: AdminSessionData,
    @Body() body: CreateProductDto,
  ) {
    const data = await this.productsAdminService.create(admin.id, body);
    return sendResponse({
      success: true,
      message: 'Product created successfully',
      data,
    });
  }

  @Get()
  async findAll(@Query() query: GetAdminProductsQueryDto) {
    const data = await this.productsAdminService.findAll(query);
    return sendResponse({
      success: true,
      message: 'Products retrieved successfully',
      data,
    });
  }

  @Get(':productId')
  async findOne(@Param() params: ProductIdParamDto) {
    const data = await this.productsAdminService.findOne(params.productId);
    return sendResponse({
      success: true,
      message: 'Product retrieved successfully',
      data,
    });
  }

  @Patch(':productId')
  async update(
    @CurrentAdmin() admin: AdminSessionData,
    @Param() params: ProductIdParamDto,
    @Body() body: UpdateProductDto,
  ) {
    const data = await this.productsAdminService.update(
      admin.id,
      params.productId,
      body,
    );
    return sendResponse({
      success: true,
      message: 'Product updated successfully',
      data,
    });
  }

  @Delete(':productId')
  async remove(@Param() params: ProductIdParamDto) {
    const data = await this.productsAdminService.softDelete(params.productId);
    return sendResponse({
      success: true,
      message: 'Product deleted successfully',
      data,
    });
  }
}
