import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  ReturnRequestActionBy,
  ReturnRequestEventType,
  ReturnRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';

@Injectable()
export class AdminReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginatedSearchQueryDto) {
    const { page, limit, search } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where: Prisma.ReturnRequestWhereInput = search
      ? {
          order: {
            orderNumber: { contains: search.trim(), mode: 'insensitive' },
          },
        }
      : {};
    const [total, rows] = await Promise.all([
      this.prisma.returnRequest.count({ where }),
      this.prisma.returnRequest.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNumber: true } },
          customer: { select: { email: true, firstName: true, lastName: true } },
          items: true,
        },
      }),
    ]);
    return PaginationHelper.formatResponse(rows, total, page, limit);
  }

  async findOne(id: string) {
    const row = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, orderNumber: true } },
        customer: { select: { email: true, firstName: true, lastName: true } },
        items: true,
        events: { orderBy: { occurredAt: 'asc' } },
      },
    });
    if (!row) throw new NotFoundException('Return request not found');
    return row;
  }

  async updateStatus(
    id: string,
    status: ReturnRequestStatus,
    adminComment?: string | null,
  ) {
    await this.findOne(id);
    return this.prisma.returnRequest.update({
      where: { id },
      data: {
        status,
        adminComment: adminComment ?? undefined,
        reviewedAt: new Date(),
        events: {
          create: {
            eventType:
              status === ReturnRequestStatus.APPROVED
                ? ReturnRequestEventType.APPROVED
                : status === ReturnRequestStatus.REJECTED
                  ? ReturnRequestEventType.REJECTED
                  : ReturnRequestEventType.REVIEWED,
            actionBy: ReturnRequestActionBy.ADMIN,
            comment: adminComment ?? null,
          },
        },
      },
      include: { items: true },
    });
  }
}
