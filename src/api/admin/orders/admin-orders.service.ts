import { Injectable, NotFoundException } from '@nestjs/common';
import {
  OrderEventActionBy,
  OrderEventType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { IPaginatedResponse } from '@common/types/pagination.types';
import { GetAdminOrdersQueryDto } from './dto/get-admin-orders-query.dto';

const adminOrderInclude = {
  customer: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
  items: true,
  billingInfo: true,
  shippingInfo: { include: { shippingMethod: true } },
  paymentMethod: { select: { id: true, code: true, name: true } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: GetAdminOrdersQueryDto,
  ): Promise<IPaginatedResponse<Record<string, unknown>>> {
    const { page, limit, status, search } = query;
    const offset = PaginationHelper.getOffset(page, limit);

    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' } },
              {
                customer: {
                  email: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: adminOrderInclude,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    const data = rows.map((o) => this.mapAdminOrder(o));
    return PaginationHelper.formatResponse(data, total, page, limit);
  }

  async findOne(orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      include: adminOrderInclude,
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.mapAdminOrder(order);
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const existing = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        events: {
          create: {
            eventType: OrderEventType.STATUS_CHANGED,
            actionBy: OrderEventActionBy.ADMIN,
            metadata: {
              previousStatus: existing.status,
              newStatus: status,
            } as Prisma.JsonObject,
          },
        },
      },
      include: adminOrderInclude,
    });

    return this.mapAdminOrder(order);
  }

  private mapAdminOrder(
    order: Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>,
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
      customer: order.customer,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        variantId: i.variantId,
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
