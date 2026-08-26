import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';

@Injectable()
export class AdminReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginatedSearchQueryDto) {
    const { page, limit, search } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where: Prisma.ReviewWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            comment: { contains: search.trim(), mode: 'insensitive' },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          orderItem: {
            select: {
              id: true,
              snapshottedTitle: true,
              order: {
                select: {
                  orderNumber: true,
                  customer: {
                    select: { email: true, firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      adminFlag: r.adminFlag,
      adminComment: r.adminComment,
      createdAt: r.createdAt,
      productTitle: r.orderItem.snapshottedTitle,
      orderNumber: r.orderItem.order.orderNumber,
      customerName: `${r.orderItem.order.customer.firstName} ${r.orderItem.order.customer.lastName}`.trim(),
      customerEmail: r.orderItem.order.customer.email,
    }));

    return PaginationHelper.formatResponse(data, total, page, limit);
  }

  async update(
    reviewId: string,
    payload: { adminFlag?: string | null; adminComment?: string | null },
  ) {
    const existing = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Review not found');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(payload.adminFlag !== undefined && { adminFlag: payload.adminFlag }),
        ...(payload.adminComment !== undefined && {
          adminComment: payload.adminComment,
        }),
      },
    });
  }

  async remove(reviewId: string) {
    const existing = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Review not found');
    await this.prisma.review.update({
      where: { id: reviewId },
      data: { deletedAt: new Date() },
    });
    return { id: reviewId };
  }
}
