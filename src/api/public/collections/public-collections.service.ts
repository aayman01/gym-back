import { Injectable, NotFoundException } from '@nestjs/common';
import { ItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const collectionInclude = {
  items: {
    orderBy: { order: 'asc' as const },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          basePrice: true,
          rating: true,
          status: true,
          deletedAt: true,
          thumbnail: { select: { url: true } },
          brand: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  },
} satisfies Prisma.CollectionInclude;

type CollectionWithItems = Prisma.CollectionGetPayload<{
  include: typeof collectionInclude;
}>;

@Injectable()
export class PublicCollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: collectionInclude,
    });
    return rows.map((r) => this.map(r));
  }

  async findBySlug(slug: string) {
    const row = await this.prisma.collection.findFirst({
      where: { slug, isActive: true },
      include: collectionInclude,
    });
    if (!row) throw new NotFoundException('Collection not found');
    return this.map(row);
  }

  private map(row: CollectionWithItems) {
    return {
      id: row.id,
      title: row.title,
      subTitle: row.subTitle,
      slug: row.slug,
      type: row.type,
      products: row.items
        .filter(
          (i) =>
            i.product.status === ItemStatus.ACTIVE && i.product.deletedAt === null,
        )
        .map((i) => ({
          id: i.product.id,
          slug: i.product.slug,
          title: i.product.title,
          summary: i.product.summary,
          basePrice: i.product.basePrice.toString(),
          rating: i.product.rating.toString(),
          thumbnailUrl: i.product.thumbnail?.url ?? null,
          images: [] as [],
          minPrice: null,
          maxPrice: null,
          brand: i.product.brand,
          category: i.product.category,
        })),
    };
  }
}
