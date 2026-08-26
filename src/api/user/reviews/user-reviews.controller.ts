import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { sendResponse } from '@common/helpers/send.response';
import { CurrentCustomer } from '@common/decorators/current-customer.decorator';
import { CustomerAuthGuard } from '@common/guards/customer-auth.guard';
import type { CustomerSessionData } from '../auth/types/customer-session.types';
import { CreateReviewDto } from './dto/create-review.dto';
import { UserReviewsService } from './user-reviews.service';

@Public()
@Controller('user/reviews')
@UseGuards(CustomerAuthGuard)
export class UserReviewsController {
  constructor(private readonly userReviewsService: UserReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentCustomer() customer: CustomerSessionData,
    @Body() dto: CreateReviewDto,
  ) {
    const data = await this.userReviewsService.create(customer.id, dto);
    return sendResponse({
      success: true,
      message: 'Review submitted',
      data,
    });
  }
}
