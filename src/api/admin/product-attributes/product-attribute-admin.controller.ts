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
import { ProductAttributeAdminService } from './product-attribute-admin.service';
import { PaginatedSearchQueryDto } from '../../../common/dto/paginated-search-query.dto';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-product-attribute.dto';
import { AttributeIdParamDto } from './dto/attribute-id-param.dto';
import { AttributeSwapDto } from './dto/attribute-swap.dto';
import { sendResponse } from '../../../common/helpers/send.response';

@Controller('admin/product-attributes')
export class ProductAttributeAdminController {
  constructor(
    private readonly productAttributeAdminService: ProductAttributeAdminService,
  ) {}

  @Post()
  async create(@Body() body: CreateProductAttributeDto) {
    const data = await this.productAttributeAdminService.create(body);
    return sendResponse({
      success: true,
      message: 'Attribute created successfully',
      data,
    });
  }

  @Get()
  async findAll(@Query() query: PaginatedSearchQueryDto) {
    const data = await this.productAttributeAdminService.findAll(query);
    return sendResponse({
      success: true,
      message: 'Attributes retrieved successfully',
      data,
    });
  }

  @Patch('swap')
  async swapAttributes(@Body() body: AttributeSwapDto) {
    await this.productAttributeAdminService.swapAttributes(body);
    return sendResponse({
      success: true,
      message: 'Attribute order swapped successfully',
      data: null,
    });
  }

  @Get(':attributeId')
  async findOne(@Param() param: AttributeIdParamDto) {
    const data = await this.productAttributeAdminService.findOne(
      param.attributeId,
    );
    return sendResponse({
      success: true,
      message: 'Attribute retrieved successfully',
      data,
    });
  }

  @Patch(':attributeId/options/swap')
  async swapOptions(
    @Param() param: AttributeIdParamDto,
    @Body() body: AttributeSwapDto,
  ) {
    await this.productAttributeAdminService.swapOptions(
      param.attributeId,
      body,
    );
    return sendResponse({
      success: true,
      message: 'Option order swapped successfully',
      data: null,
    });
  }

  @Patch(':attributeId')
  async update(
    @Param() param: AttributeIdParamDto,
    @Body() body: UpdateProductAttributeDto,
  ) {
    const data = await this.productAttributeAdminService.update(
      param.attributeId,
      body,
    );
    return sendResponse({
      success: true,
      message: 'Attribute updated successfully',
      data,
    });
  }

  @Delete(':attributeId')
  async delete(@Param() param: AttributeIdParamDto) {
    const data = await this.productAttributeAdminService.delete(
      param.attributeId,
    );
    return sendResponse({
      success: true,
      message: 'Attribute deleted successfully',
      data,
    });
  }
}
