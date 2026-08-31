import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactMessageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginatedSearchQuerySchema } from '@common/dto/paginated-search-query.dto';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { z } from 'zod';

type ListQuery = z.infer<typeof paginatedSearchQuerySchema> & {
  status?: ContactMessageStatus;
};

@Injectable()
export class AdminContactMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQuery) {
    const { page, limit, search, status } = query;
    const offset = PaginationHelper.getOffset(page, limit);

    const where: Prisma.ContactMessageWhereInput = {};
    if (status) where.status = status;
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return PaginationHelper.formatResponse(rows, total, page, limit);
  }

  async findOne(id: string) {
    const row = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Contact message not found');
    return row;
  }

  async updateStatus(id: string, status: ContactMessageStatus) {
    await this.findOne(id);
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status },
    });
  }
}
