import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { DiscountType } from '@prisma/client';
import { AdminCouponsService } from './admin-coupons.service';

const idSchema = z.object({ couponId: z.string().uuid() });
class CouponIdParamDto extends createZodDto(idSchema) {}

const upsertSchema = z.object({
  code: z.string().trim().min(1).max(50),
  type: z.nativeEnum(DiscountType),
  value: z.number().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  maxRedemptions: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});
class CreateCouponDto extends createZodDto(upsertSchema) {}
class UpdateCouponDto extends createZodDto(upsertSchema.partial()) {}

@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly coupons: AdminCouponsService) {}

  @Post()
  async create(@Body() body: CreateCouponDto) {
    const data = await this.coupons.create(body);
    return sendResponse({ success: true, message: 'Coupon created', data });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: PaginatedSearchQueryDto) {
    const data = await this.coupons.findAll(query);
    return sendResponse({ success: true, message: 'Coupons retrieved', data });
  }

  @Get(':couponId')
  async findOne(@Param() param: CouponIdParamDto) {
    const data = await this.coupons.findOne(param.couponId);
    return sendResponse({ success: true, message: 'Coupon retrieved', data });
  }

  @Patch(':couponId')
  async update(@Param() param: CouponIdParamDto, @Body() body: UpdateCouponDto) {
    const data = await this.coupons.update(param.couponId, body);
    return sendResponse({ success: true, message: 'Coupon updated', data });
  }

  @Delete(':couponId')
  async remove(@Param() param: CouponIdParamDto) {
    const data = await this.coupons.remove(param.couponId);
    return sendResponse({ success: true, message: 'Coupon deleted', data });
  }
}
