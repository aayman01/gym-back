import { Injectable } from '@nestjs/common';
import { ItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const brandAdminInclude = {
  logo: { select: { id: true, url: true } },
} satisfies Prisma.BrandInclude;

export type BrandAdminPayload = Prisma.BrandGetPayload<{
  include: typeof brandAdminInclude;
}>;

@Injectable()
export class BrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  buildListWhere(
    search?: string,
    status?: ItemStatus,
  ): Prisma.BrandWhereInput {
    const trimmed = search?.trim();
    const and: Prisma.BrandWhereInput[] = [{ deletedAt: null }];

    if (trimmed) {
      and.push({
        name: { contains: trimmed, mode: 'insensitive' },
      });
    }

    if (status !== undefined) {
      and.push({ status });
    }

    return { AND: and };
  }

  async findMaxOrder(tx?: Prisma.TransactionClient): Promise<number> {
    const agg = await this.client(tx).brand.aggregate({
      where: { deletedAt: null },
      _max: { order: true },
    });
    return agg._max.order ?? -1;
  }

  async count(
    where: Prisma.BrandWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    return this.client(tx).brand.count({ where });
  }

  async findManyPaginated(
    where: Prisma.BrandWhereInput,
    skip: number,
    take: number,
    tx?: Prisma.TransactionClient,
  ): Promise<BrandAdminPayload[]> {
    return this.client(tx).brand.findMany({
      where,
      skip,
      take,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: brandAdminInclude,
    });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<BrandAdminPayload | null> {
    return this.client(tx).brand.findFirst({
      where: { id, deletedAt: null },
      include: brandAdminInclude,
    });
  }

  async findBySlug(
    slug: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string } | null> {
    return this.client(tx).brand.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
  }

  async findBySlugExcludingId(
    slug: string,
    excludeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string } | null> {
    return this.client(tx).brand.findFirst({
      where: { slug, deletedAt: null, NOT: { id: excludeId } },
      select: { id: true },
    });
  }

  async findByIdForSwap(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; order: number } | null> {
    return this.client(tx).brand.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, order: true },
    });
  }

  async create(
    data: Prisma.BrandCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.client(tx).brand.create({
      data,
      include: brandAdminInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.BrandUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.client(tx).brand.update({
      where: { id },
      data,
      include: brandAdminInclude,
    });
  }

  async swapOrder(
    a: { id: string; order: number },
    b: { id: string; order: number },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.client(tx);
    const temp = a.order;
    await db.brand.update({
      where: { id: a.id },
      data: { order: b.order },
    });
    await db.brand.update({
      where: { id: b.id },
      data: { order: temp },
    });
  }
}
