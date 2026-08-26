import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderReturnStatus,
  ReturnRequestActionBy,
  ReturnRequestEventType,
  ReturnRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UserReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(customerId: string) {
    const rows = await this.prisma.returnRequest.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        order: { select: { orderNumber: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      customerReason: r.customerReason,
      createdAt: r.createdAt,
      orderNumber: r.order.orderNumber,
      items: r.items,
    }));
  }

  async create(
    customerId: string,
    orderId: string,
    dto: {
      items: { orderItemId: string; quantityRequested: number; reason: string }[];
      customerReason?: string | null;
      customerComment?: string | null;
    },
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId, deletedAt: null },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const itemMap = new Map(order.items.map((i) => [i.id, i]));
    for (const line of dto.items) {
      const item = itemMap.get(line.orderItemId);
      if (!item) throw new BadRequestException('Invalid order item');
      if (line.quantityRequested > item.quantity) {
        throw new BadRequestException('Quantity exceeds purchased amount');
      }
    }

    const created = await this.prisma.returnRequest.create({
      data: {
        orderId,
        customerId,
        requestedById: customerId,
        customerReason: dto.customerReason ?? null,
        customerComment: dto.customerComment ?? null,
        status: ReturnRequestStatus.PENDING,
        items: {
          create: dto.items.map((line) => {
            const item = itemMap.get(line.orderItemId)!;
            return {
              orderItemId: line.orderItemId,
              variantId: item.variantId,
              quantityRequested: line.quantityRequested,
              reason: line.reason,
            };
          }),
        },
        events: {
          create: {
            eventType: ReturnRequestEventType.CREATED,
            actionBy: ReturnRequestActionBy.CUSTOMER,
          },
        },
      },
      include: { items: true },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { returnStatus: OrderReturnStatus.PARTIALLY_RETURNED },
    });

    return created;
  }
}
