import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { sendResponse } from '@common/helpers/send.response';
import { PublicReviewsService } from './public-reviews.service';
import { ProductIdReviewsParamDto } from './dto/product-id-reviews-param.dto';
import { ProductReviewsQueryDto } from './dto/product-reviews-query.dto';

@Public()
@Controller('public/products')
export class PublicReviewsController {
  constructor(private readonly publicReviewsService: PublicReviewsService) {}

  @Get(':productId/reviews')
  @HttpCode(HttpStatus.OK)
  async listByProduct(
    @Param() param: ProductIdReviewsParamDto,
    @Query() query: ProductReviewsQueryDto,
  ) {
    const data = await this.publicReviewsService.findByProductId(
      param.productId,
      query,
    );
    return sendResponse({
      success: true,
      message: 'Reviews retrieved successfully',
      data,
    });
  }
}
