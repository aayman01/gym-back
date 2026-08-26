import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';

type CouponInput = {
  code?: string;
  type?: DiscountType;
  value?: number;
  startDate?: Date;
  endDate?: Date;
  maxRedemptions?: number | null;
  isActive?: boolean;
};

@Injectable()
export class AdminCouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CouponInput) {
    if (payload.endDate && payload.startDate && payload.endDate < payload.startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }
    const row = await this.prisma.coupon.create({
      data: {
        code: payload.code!.toUpperCase().trim(),
        type: payload.type!,
        value: payload.value!,
        startDate: payload.startDate!,
        endDate: payload.endDate!,
        maxRedemptions: payload.maxRedemptions ?? null,
        isActive: payload.isActive ?? true,
      },
    });
    return this.map(row);
  }

  async findAll(query: PaginatedSearchQueryDto) {
    const { page, limit, search } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where: Prisma.CouponWhereInput = {
      deletedAt: null,
      ...(search
        ? { code: { contains: search.trim(), mode: 'insensitive' } }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.coupon.count({ where }),
      this.prisma.coupon.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return PaginationHelper.formatResponse(rows.map((r) => this.map(r)), total, page, limit);
  }

  async findOne(id: string) {
    const row = await this.prisma.coupon.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Coupon not found');
    return this.map(row);
  }

  async update(id: string, payload: CouponInput) {
    await this.findOne(id);
    const row = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...(payload.code !== undefined && { code: payload.code.toUpperCase().trim() }),
        ...(payload.type !== undefined && { type: payload.type }),
        ...(payload.value !== undefined && { value: payload.value }),
        ...(payload.startDate !== undefined && { startDate: payload.startDate }),
        ...(payload.endDate !== undefined && { endDate: payload.endDate }),
        ...(payload.maxRedemptions !== undefined && {
          maxRedemptions: payload.maxRedemptions,
        }),
        ...(payload.isActive !== undefined && { isActive: payload.isActive }),
      },
    });
    return this.map(row);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.coupon.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { id };
  }

  private map(row: {
    id: string;
    code: string;
    type: DiscountType;
    value: Prisma.Decimal;
    startDate: Date;
    endDate: Date;
    maxRedemptions: number | null;
    redemptionCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...row,
      value: row.value.toString(),
    };
  }
}
