import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { IPaginatedResponse } from '@common/types/pagination.types';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';

const orderPublicInclude = {
  items: true,
  billingInfo: true,
  shippingInfo: { include: { shippingMethod: true } },
  paymentMethod: { select: { id: true, code: true, name: true } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findManyForCustomer(
    customerId: string,
    query: GetOrdersQueryDto,
  ): Promise<IPaginatedResponse<Record<string, unknown>>> {
    const { page, limit } = query;
    const offset = PaginationHelper.getOffset(page, limit);

    const where: Prisma.OrderWhereInput = {
      customerId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderPublicInclude,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    const data = rows.map((o) => this.mapOrder(o));
    return PaginationHelper.formatResponse(data, total, page, limit);
  }

  async findOneForCustomer(orderId: string, customerId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId, deletedAt: null },
      include: orderPublicInclude,
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.mapOrder(order);
  }

  private mapOrder(
    order: Prisma.OrderGetPayload<{ include: typeof orderPublicInclude }>,
  ) {
    const itemTotal = order.items.reduce(
      (sum, i) => sum.add(i.lineTotal),
      new Prisma.Decimal(0),
    );
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      returnStatus: order.returnStatus,
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      itemTotal: itemTotal.toString(),
      taxAmount: order.taxAmount.toString(),
      shippingAmount: order.shippingAmount.toString(),
      totalAmount: order.totalAmount.toString(),
      discountAmount: order.discountAmount.toString(),
      items: order.items.map((i) => ({
        id: i.id,
        title: i.snapshottedTitle,
        sku: i.snapshottedSku,
        unit: i.snapshottedUnit,
        quantity: i.quantity,
        unitPrice: i.price.toString(),
        lineTotal: i.lineTotal.toString(),
      })),
      billing: order.billingInfo,
      shipping: order.shippingInfo,
      paymentMethod: order.paymentMethod,
    };
  }
}
