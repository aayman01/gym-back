import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';

@Injectable()
export class AdminCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginatedSearchQueryDto) {
    const { page, limit, search } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where: Prisma.UserWhereInput = {
      role: UserRole.CUSTOMER,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { email: { contains: search.trim(), mode: 'insensitive' } },
              { firstName: { contains: search.trim(), mode: 'insensitive' } },
              { lastName: { contains: search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);
    return PaginationHelper.formatResponse(
      rows.map((r) => ({
        id: r.id,
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName,
        phone: r.phone,
        isActive: r.isActive,
        createdAt: r.createdAt,
        orderCount: r._count.orders,
      })),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string) {
    const row = await this.prisma.user.findFirst({
      where: { id, role: UserRole.CUSTOMER, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Customer not found');
    return {
      ...row,
      orders: row.orders.map((o) => ({
        ...o,
        totalAmount: o.totalAmount.toString(),
      })),
    };
  }

  async update(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
  }
}
