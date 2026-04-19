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
import { CategoryAdminService } from './category-admin.service';
import { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryIdParamDto } from './dto/category-id-param.dto';
import { CategorySwapDto } from './dto/category-swap.dto';
import { sendResponse } from '@common/helpers/send.response';

@Controller('admin/categories')
export class CategoryAdminController {
  constructor(private readonly categoryAdminService: CategoryAdminService) {}

  @Post()
  async create(@Body() body: CreateCategoryDto) {
    const data = await this.categoryAdminService.create(body);
    return sendResponse({
      success: true,
      message: 'Category created successfully',
      data,
    });
  }

  @Get()
  async findAll(@Query() query: PaginatedSearchQueryDto) {
    const data = await this.categoryAdminService.findAll(query);
    return sendResponse({
      success: true,
      message: 'Categories retrieved successfully',
      data,
    });
  }

  @Patch('swap')
  async swapOrder(@Body() body: CategorySwapDto) {
    await this.categoryAdminService.swapOrder(body);
    return sendResponse({
      success: true,
      message: 'Category order swapped successfully',
      data: null,
    });
  }

  @Get(':categoryId')
  async findOne(@Param() param: CategoryIdParamDto) {
    const data = await this.categoryAdminService.findOne(param.categoryId);
    return sendResponse({
      success: true,
      message: 'Category retrieved successfully',
      data,
    });
  }

  @Patch(':categoryId')
  async update(
    @Param() param: CategoryIdParamDto,
    @Body() body: UpdateCategoryDto,
  ) {
    const data = await this.categoryAdminService.update(param.categoryId, body);
    return sendResponse({
      success: true,
      message: 'Category updated successfully',
      data,
    });
  }

  @Delete(':categoryId')
  async delete(@Param() param: CategoryIdParamDto) {
    const data = await this.categoryAdminService.delete(param.categoryId);
    return sendResponse({
      success: true,
      message: 'Category deleted successfully',
      data,
    });
  }
}
