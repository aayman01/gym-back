import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionType, ItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';

type UpsertInput = {
  title?: string;
  subTitle?: string | null;
  slug?: string;
  type?: CollectionType;
  isActive?: boolean;
  productIds?: string[];
};

@Injectable()
export class AdminCollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: UpsertInput) {
    const max = await this.prisma.collection.aggregate({ _max: { order: true } });
    return this.prisma.collection.create({
      data: {
        title: payload.title!,
        subTitle: payload.subTitle ?? null,
        slug: payload.slug!,
        type: payload.type ?? CollectionType.DEFAULT,
        isActive: payload.isActive ?? true,
        order: (max._max.order ?? -1) + 1,
        items: payload.productIds?.length
          ? {
              create: payload.productIds.map((productId, index) => ({
                productId,
                order: index,
              })),
            }
          : undefined,
      },
      include: this.include(),
    });
  }

  async findAll(query: PaginatedSearchQueryDto) {
    const { page, limit, search } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where: Prisma.CollectionWhereInput = search
      ? { title: { contains: search.trim(), mode: 'insensitive' } }
      : {};
    const [total, rows] = await Promise.all([
      this.prisma.collection.count({ where }),
      this.prisma.collection.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { order: 'asc' },
        include: this.include(),
      }),
    ]);
    return PaginationHelper.formatResponse(
      rows.map((r) => this.map(r)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string) {
    const row = await this.prisma.collection.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!row) throw new NotFoundException('Collection not found');
    return this.map(row);
  }

  async update(id: string, payload: UpsertInput) {
    const existing = await this.prisma.collection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Collection not found');

    return this.prisma.$transaction(async (tx) => {
      if (payload.productIds) {
        await tx.collectionItem.deleteMany({ where: { collectionId: id } });
        if (payload.productIds.length) {
          await tx.collectionItem.createMany({
            data: payload.productIds.map((productId, index) => ({
              collectionId: id,
              productId,
              order: index,
            })),
          });
        }
      }

      const updated = await tx.collection.update({
        where: { id },
        data: {
          ...(payload.title !== undefined && { title: payload.title }),
          ...(payload.subTitle !== undefined && { subTitle: payload.subTitle }),
          ...(payload.slug !== undefined && { slug: payload.slug }),
          ...(payload.type !== undefined && { type: payload.type }),
          ...(payload.isActive !== undefined && { isActive: payload.isActive }),
        },
        include: this.include(),
      });
      return this.map(updated);
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.collection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Collection not found');
    await this.prisma.collection.delete({ where: { id } });
    return { id };
  }

  private include() {
    return {
      items: {
        orderBy: { order: 'asc' as const },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              thumbnail: { select: { url: true } },
            },
          },
        },
      },
    };
  }

  private map(
    row: Prisma.CollectionGetPayload<{ include: ReturnType<AdminCollectionsService['include']> }>,
  ) {
    return {
      id: row.id,
      title: row.title,
      subTitle: row.subTitle,
      slug: row.slug,
      type: row.type,
      isActive: row.isActive,
      order: row.order,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      items: row.items
        .filter((i) => i.product.status === ItemStatus.ACTIVE)
        .map((i) => ({
          id: i.id,
          productId: i.productId,
          title: i.product.title,
          slug: i.product.slug,
          thumbnailUrl: i.product.thumbnail?.url ?? null,
        })),
    };
  }
}
