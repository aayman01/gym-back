import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { sendResponse } from '@common/helpers/send.response';
import { PublicCategoriesService } from './public-categories.service';
import { CategorySlugParamDto } from './dto/category-slug-param.dto';

@Public()
@Controller('public/categories')
export class PublicCategoriesController {
  constructor(
    private readonly publicCategoriesService: PublicCategoriesService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list() {
    const data = await this.publicCategoriesService.findAll();
    return sendResponse({
      success: true,
      message: 'Categories retrieved successfully',
      data,
    });
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async detail(@Param() param: CategorySlugParamDto) {
    const data = await this.publicCategoriesService.findBySlug(param.slug);
    return sendResponse({
      success: true,
      message: 'Category retrieved successfully',
      data,
    });
  }
}
