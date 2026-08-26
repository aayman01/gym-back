import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

const REVIEWABLE: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

@Injectable()
export class UserReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateReviewDto) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: dto.orderItemId },
      include: {
        order: { select: { id: true, customerId: true, status: true } },
        review: { select: { id: true } },
      },
    });
    if (!item || item.order.customerId !== customerId) {
      throw new NotFoundException('Order item not found');
    }
    if (!item.productId) {
      throw new BadRequestException('This item cannot be reviewed');
    }
    if (!REVIEWABLE.includes(item.order.status)) {
      throw new BadRequestException('You can review this item after the order is confirmed');
    }
    if (item.review) {
      throw new ConflictException('This item already has a review');
    }

    const review = await this.prisma.review.create({
      data: {
        orderItemId: item.id,
        rating: dto.rating,
        comment: dto.comment ?? null,
        isVerifiedPurchase: true,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        isVerifiedPurchase: true,
        createdAt: true,
      },
    });

    const agg = await this.prisma.review.aggregate({
      where: {
        deletedAt: null,
        orderItem: { productId: item.productId },
      },
      _avg: { rating: true },
    });
    await this.prisma.product.update({
      where: { id: item.productId },
      data: { rating: agg._avg.rating ?? 0 },
    });

    return review;
  }
}
