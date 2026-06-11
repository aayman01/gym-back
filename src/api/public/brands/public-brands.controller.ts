import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { sendResponse } from '@common/helpers/send.response';
import { PublicBrandsService } from './public-brands.service';

@Public()
@Controller('public/brands')
export class PublicBrandsController {
  constructor(private readonly publicBrandsService: PublicBrandsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list() {
    const data = await this.publicBrandsService.findAll();
    return sendResponse({
      success: true,
      message: 'Brands retrieved successfully',
      data,
    });
  }
}
