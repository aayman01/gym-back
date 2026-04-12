import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const categoryAdminInclude = {
  image: { select: { id: true, url: true } },
} satisfies Prisma.CategoryInclude;

export type CategoryAdminPayload = Prisma.CategoryGetPayload<{
  include: typeof categoryAdminInclude;
}>;

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  buildListWhere(search?: string): Prisma.CategoryWhereInput {
    const notDeleted: Prisma.CategoryWhereInput = { deletedAt: null };

    const trimmed = search?.trim();
    if (!trimmed) {
      return notDeleted;
    }

    return {
      AND: [
        notDeleted,
        {
          OR: [
            { name: { contains: trimmed, mode: 'insensitive' } },
            { slug: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
      ],
    };
  }

  async findMaxOrder(tx?: Prisma.TransactionClient): Promise<number> {
    const agg = await this.client(tx).category.aggregate({
      where: { deletedAt: null },
      _max: { order: true },
    });
    return agg._max.order ?? -1;
  }

  async count(
    where: Prisma.CategoryWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    return this.client(tx).category.count({ where });
  }

  async findManyPaginated(
    where: Prisma.CategoryWhereInput,
    skip: number,
    take: number,
    tx?: Prisma.TransactionClient,
  ): Promise<CategoryAdminPayload[]> {
    return this.client(tx).category.findMany({
      where,
      skip,
      take,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: categoryAdminInclude,
    });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CategoryAdminPayload | null> {
    return this.client(tx).category.findFirst({
      where: { id, deletedAt: null },
      include: categoryAdminInclude,
    });
  }

  async findByIdIncludingDeleted(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CategoryAdminPayload | null> {
    return this.client(tx).category.findUnique({
      where: { id },
      include: categoryAdminInclude,
    });
  }

  async findBySlug(
    slug: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string } | null> {
    return this.client(tx).category.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
  }

  async findBySlugExcludingId(
    slug: string,
    excludeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string } | null> {
    return this.client(tx).category.findFirst({
      where: { slug, deletedAt: null, NOT: { id: excludeId } },
      select: { id: true },
    });
  }

  async findByIdForSwap(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; order: number } | null> {
    return this.client(tx).category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, order: true },
    });
  }

  async create(
    data: Prisma.CategoryCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.client(tx).category.create({
      data,
      include: categoryAdminInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.CategoryUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.client(tx).category.update({
      where: { id },
      data,
      include: categoryAdminInclude,
    });
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient) {
    return this.client(tx).category.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  async swapOrder(
    a: { id: string; order: number },
    b: { id: string; order: number },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.client(tx);
    const temp = a.order;
    await db.category.update({
      where: { id: a.id },
      data: { order: b.order },
    });
    await db.category.update({
      where: { id: b.id },
      data: { order: temp },
    });
  }
}
