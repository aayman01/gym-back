import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BrandAdminService } from './brand-admin.service';
import { GetBrandsQueryDto } from './dto/get-brands-query.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandIdParamDto } from './dto/brand-id-param.dto';
import { BrandSwapDto } from './dto/brand-swap.dto';
import { sendResponse } from '../../../common/helpers/send.response';

@Controller('admin/brands')
export class BrandAdminController {
  constructor(private readonly brandAdminService: BrandAdminService) {}

  @Post()
  async create(@Body() body: CreateBrandDto) {
    const data = await this.brandAdminService.create(body);
    return sendResponse({
      success: true,
      message: 'Brand created successfully',
      data,
    });
  }

  @Get()
  async findAll(@Query() query: GetBrandsQueryDto) {
    const data = await this.brandAdminService.findAll(query);
    return sendResponse({
      success: true,
      message: 'Brands retrieved successfully',
      data,
    });
  }

  @Patch('swap')
  async swapOrder(@Body() body: BrandSwapDto) {
    await this.brandAdminService.swapOrder(body);
    return sendResponse({
      success: true,
      message: 'Brand order swapped successfully',
      data: null,
    });
  }

  @Get(':brandId')
  async findOne(@Param() param: BrandIdParamDto) {
    const data = await this.brandAdminService.findOne(param.brandId);
    return sendResponse({
      success: true,
      message: 'Brand retrieved successfully',
      data,
    });
  }

  @Patch(':brandId')
  async update(
    @Param() param: BrandIdParamDto,
    @Body() body: UpdateBrandDto,
  ) {
    const data = await this.brandAdminService.update(param.brandId, body);
    return sendResponse({
      success: true,
      message: 'Brand updated successfully',
      data,
    });
  }
}
