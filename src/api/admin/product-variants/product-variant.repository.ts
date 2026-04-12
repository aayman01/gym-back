import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const productVariantAdminInclude = {
  product: {
    select: {
      id: true,
      slug: true,
      title: true,
      deletedAt: true,
      thumbnail: { select: { url: true } },
    },
  },
  attributes: {
    include: {
      option: {
        include: {
          attribute: true,
        },
      },
    },
  },
  inventory: true,
} satisfies Prisma.ProductVariantInclude;

export type ProductVariantAdminPayload = Prisma.ProductVariantGetPayload<{
  include: typeof productVariantAdminInclude;
}>;

@Injectable()
export class ProductVariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  buildListWhere(search?: string): Prisma.ProductVariantWhereInput {
    const base: Prisma.ProductVariantWhereInput = {
      product: { deletedAt: null },
    };

    const trimmed = search?.trim();
    if (!trimmed) {
      return base;
    }

    return {
      AND: [
        base,
        {
          OR: [
            { sku: { contains: trimmed, mode: 'insensitive' } },
            {
              product: {
                slug: { contains: trimmed, mode: 'insensitive' },
              },
            },
            {
              product: {
                title: { contains: trimmed, mode: 'insensitive' },
              },
            },
          ],
        },
      ],
    };
  }

  async count(where: Prisma.ProductVariantWhereInput): Promise<number> {
    return this.prisma.productVariant.count({ where });
  }

  async findManyPaginated(
    where: Prisma.ProductVariantWhereInput,
    skip: number,
    take: number,
  ): Promise<ProductVariantAdminPayload[]> {
    return this.prisma.productVariant.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: productVariantAdminInclude,
    });
  }

  async findOneById(id: string): Promise<ProductVariantAdminPayload | null> {
    return this.prisma.productVariant.findFirst({
      where: { id },
      include: productVariantAdminInclude,
    });
  }
}
