import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AdminReviewsService } from './admin-reviews.service';

const reviewIdSchema = z.object({ reviewId: z.string().uuid() });
class ReviewIdParamDto extends createZodDto(reviewIdSchema) {}

const updateReviewSchema = z.object({
  adminFlag: z.string().max(50).optional().nullable(),
  adminComment: z.string().max(5000).optional().nullable(),
});
class UpdateAdminReviewDto extends createZodDto(updateReviewSchema) {}

@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly adminReviewsService: AdminReviewsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: PaginatedSearchQueryDto) {
    const data = await this.adminReviewsService.findAll(query);
    return sendResponse({ success: true, message: 'Reviews retrieved', data });
  }

  @Patch(':reviewId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param() param: ReviewIdParamDto,
    @Body() body: UpdateAdminReviewDto,
  ) {
    const data = await this.adminReviewsService.update(param.reviewId, body);
    return sendResponse({ success: true, message: 'Review updated', data });
  }

  @Delete(':reviewId')
  @HttpCode(HttpStatus.OK)
  async remove(@Param() param: ReviewIdParamDto) {
    const data = await this.adminReviewsService.remove(param.reviewId);
    return sendResponse({ success: true, message: 'Review removed', data });
  }
}
