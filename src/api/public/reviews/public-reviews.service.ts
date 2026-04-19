import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { IPaginatedResponse } from '@common/types/pagination.types';
import { ProductReviewsQueryDto } from './dto/product-reviews-query.dto';

@Injectable()
export class PublicReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProductId(
    productId: string,
    query: ProductReviewsQueryDto,
  ): Promise<IPaginatedResponse<Record<string, unknown>>> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const { page, limit } = query;
    const offset = PaginationHelper.getOffset(page, limit);

    const where: Prisma.ReviewWhereInput = {
      deletedAt: null,
      orderItem: {
        productId,
      },
    };

    const [total, rows] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          isVerifiedPurchase: true,
          createdAt: true,
          updatedAt: true,
          images: {
            select: {
              id: true,
              image: { select: { id: true, url: true } },
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
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      images: r.images.map((img) => ({
        id: img.id,
        url: img.image.url,
      })),
    }));

    return PaginationHelper.formatResponse(data, total, page, limit);
  }
}
