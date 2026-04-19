import { Injectable, NotFoundException } from '@nestjs/common';
import { ItemStatus, Prisma, ProductType, SellingUnit } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { IPaginatedResponse } from '@common/types/pagination.types';
import { GetPublicProductsQueryDto } from './dto/public-products-query.dto';

const listInclude = {
  thumbnail: true,
  brand: true,
  category: true,
  variants: {
    where: { status: ItemStatus.ACTIVE },
    select: {
      id: true,
      price: true,
      status: true,
      inventory: { select: { quantityOnHand: true, quantityReserved: true } },
    },
  },
} satisfies Prisma.ProductInclude;

export type PublicProductCard = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  basePrice: string;
  rating: string;
  thumbnailUrl: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  category: { id: string; name: string; slug: string };
};

export type PublicProductDetail = {
  id: string;
  slug: string;
  basePrice: string;
  rating: string;
  type: string;
  sellingUnit: string;
  status: string;
  categoryId: string;
  title: string;
  summary: string | null;
  description: string | null;
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
  thumbnail: {
    id: string;
    url: string;
    mimeType: string;
  } | null;
  sampleImages: {
    id: string;
    order: number;
    variantId: string | null;
    image: { id: string; url: string; mimeType: string };
  }[];
  brand: {
    id: string;
    name: string;
    slug: string;
    logo: { id: string; url: string } | null;
  } | null;
  attributes: {
    id: string;
    name: string;
    options: { id: string; value: string; order: number }[];
  }[];
  variants: {
    id: string;
    sku: string;
    price: string;
    status: string;
    isBase: boolean;
    displayImage: { id: string; url: string } | null;
    availableStock: number;
    attributeOptions: {
      attribute: { id: string; name: string };
      option: { id: string; value: string };
    }[];
    sampleImages: {
      id: string;
      order: number;
      image: { id: string; url: string };
    }[];
  }[];
  relatedProducts: PublicProductCard[];
};

export type PublicProductsAppliedFilters = {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  brandId?: string;
  minRating?: number;
  type?: ProductType;
  sellingUnit?: SellingUnit;
  minBasePrice?: number;
  maxBasePrice?: number;
  minPrice?: number;
  maxPrice?: number;
};

export type PublicProductsListPayload =
  IPaginatedResponse<PublicProductCard> & {
    filters: PublicProductsAppliedFilters;
  };

@Injectable()
export class PublicProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildListWhere(
    query: GetPublicProductsQueryDto,
  ): Prisma.ProductWhereInput {
    const {
      search,
      categoryId,
      categorySlug,
      brandId,
      minRating,
      type,
      sellingUnit,
      minBasePrice,
      maxBasePrice,
      minPrice,
      maxPrice,
    } = query;

    const filters: Prisma.ProductWhereInput[] = [
      { deletedAt: null },
      { status: ItemStatus.ACTIVE },
    ];

    const categorySlugTrimmed = categorySlug?.trim();
    if (categorySlugTrimmed) {
      filters.push({ category: { slug: categorySlugTrimmed } });
    } else if (categoryId) {
      filters.push({ categoryId });
    }
    if (brandId) filters.push({ brandId });
    if (type) filters.push({ type });
    if (sellingUnit) filters.push({ sellingUnit });
    if (minRating !== undefined) {
      filters.push({ rating: { gte: new Prisma.Decimal(minRating) } });
    }
    if (minBasePrice !== undefined) {
      filters.push({
        basePrice: { gte: new Prisma.Decimal(minBasePrice) },
      });
    }
    if (maxBasePrice !== undefined) {
      filters.push({
        basePrice: { lte: new Prisma.Decimal(maxBasePrice) },
      });
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.push({
        variants: {
          some: {
            status: ItemStatus.ACTIVE,
            price: {
              ...(minPrice !== undefined
                ? { gte: new Prisma.Decimal(minPrice) }
                : {}),
              ...(maxPrice !== undefined
                ? { lte: new Prisma.Decimal(maxPrice) }
                : {}),
            },
          },
        },
      });
    }

    const trimmed = search?.trim();
    if (trimmed) {
      filters.push({
        OR: [
          { slug: { contains: trimmed, mode: 'insensitive' } },
          { title: { contains: trimmed, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: filters };
  }

  private buildAppliedFilters(
    query: GetPublicProductsQueryDto,
  ): PublicProductsAppliedFilters {
    const {
      page,
      limit,
      search,
      categoryId,
      categorySlug,
      brandId,
      minRating,
      type,
      sellingUnit,
      minBasePrice,
      maxBasePrice,
      minPrice,
      maxPrice,
    } = query;

    const out: PublicProductsAppliedFilters = { page, limit };

    const trimmedSearch = search?.trim();
    if (trimmedSearch) out.search = trimmedSearch;

    const slugTrimmed = categorySlug?.trim();
    if (slugTrimmed) {
      out.categorySlug = slugTrimmed;
    } else if (categoryId) {
      out.categoryId = categoryId;
    }

    if (brandId) out.brandId = brandId;
    if (minRating !== undefined) out.minRating = minRating;
    if (type) out.type = type;
    if (sellingUnit) out.sellingUnit = sellingUnit;
    if (minBasePrice !== undefined) out.minBasePrice = minBasePrice;
    if (maxBasePrice !== undefined) out.maxBasePrice = maxBasePrice;
    if (minPrice !== undefined) out.minPrice = minPrice;
    if (maxPrice !== undefined) out.maxPrice = maxPrice;

    return out;
  }

  private toCard(
    row: Prisma.ProductGetPayload<{ include: typeof listInclude }>,
  ): PublicProductCard {
    const prices = row.variants.map((v) => Number(v.price));
    const minPrice = prices.length > 0 ? Math.min(...prices).toFixed(2) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices).toFixed(2) : null;

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      basePrice: row.basePrice.toString(),
      rating: row.rating.toString(),
      thumbnailUrl: row.thumbnail?.url ?? null,
      minPrice,
      maxPrice,
      brand: row.brand
        ? {
            id: row.brand.id,
            name: row.brand.name,
            slug: row.brand.slug,
          }
        : null,
      category: {
        id: row.category.id,
        name: row.category.name,
        slug: row.category.slug,
      },
    };
  }

  async findAll(
    query: GetPublicProductsQueryDto,
  ): Promise<PublicProductsListPayload> {
    const { page, limit } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where = this.buildListWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: listInclude,
      }),
    ]);

    const data = rows.map((r) => this.toCard(r));
    return {
      ...PaginationHelper.formatResponse(data, total, page, limit),
      filters: this.buildAppliedFilters(query),
    };
  }

  async search(
    q: string,
    page: number,
    limit: number,
  ): Promise<IPaginatedResponse<PublicProductCard>> {
    const offset = PaginationHelper.getOffset(page, limit);
    const term = q.trim();
    const where: Prisma.ProductWhereInput = {
      AND: [
        { deletedAt: null },
        { status: ItemStatus.ACTIVE },
        {
          OR: [
            { slug: { contains: term, mode: 'insensitive' } },
            { title: { contains: term, mode: 'insensitive' } },
            { summary: { contains: term, mode: 'insensitive' } },
          ],
        },
      ],
    };

    const [total, rows] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: listInclude,
      }),
    ]);

    const data = rows.map((r) => this.toCard(r));
    return PaginationHelper.formatResponse(data, total, page, limit);
  }

  async findOne(identifier: string): Promise<PublicProductDetail> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    const product = await this.prisma.product.findFirst({
      where: {
        deletedAt: null,
        status: ItemStatus.ACTIVE,
        ...(isUuid ? { id: identifier } : { slug: identifier }),
      },
      include: {
        thumbnail: true,
        brand: { include: { logo: true } },
        category: true,
        sampleImages: {
          orderBy: { order: 'asc' },
          include: { image: true },
        },
        variants: {
          where: { status: ItemStatus.ACTIVE },
          orderBy: { createdAt: 'asc' },
          include: {
            displayImage: true,
            inventory: true,
            attributes: {
              include: {
                option: { include: { attribute: true } },
              },
            },
            sampleImages: {
              orderBy: { order: 'asc' },
              include: { image: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const attributeMap = new Map<
      string,
      {
        id: string;
        name: string;
        options: Map<string, { id: string; value: string; order: number }>;
      }
    >();

    for (const v of product.variants) {
      for (const va of v.attributes) {
        const attr = va.option.attribute;
        if (!attributeMap.has(attr.id)) {
          attributeMap.set(attr.id, {
            id: attr.id,
            name: attr.name,
            options: new Map(),
          });
        }
        const opt = va.option;
        attributeMap.get(attr.id)!.options.set(opt.id, {
          id: opt.id,
          value: opt.value,
          order: opt.order,
        });
      }
    }

    const attributes = [...attributeMap.values()].map((a) => ({
      id: a.id,
      name: a.name,
      options: [...a.options.values()].sort((x, y) => x.order - y.order),
    }));

    const related = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        status: ItemStatus.ACTIVE,
        categoryId: product.categoryId,
        NOT: { id: product.id },
      },
      orderBy: { rating: 'desc' },
      take: 5,
      include: listInclude,
    });

    return {
      id: product.id,
      slug: product.slug,
      basePrice: product.basePrice.toString(),
      rating: product.rating.toString(),
      type: product.type,
      sellingUnit: product.sellingUnit,
      status: product.status,
      categoryId: product.categoryId,
      title: product.title,
      summary: product.summary,
      description: product.description,
      metaTitle: product.metaTitle,
      metaKeywords: product.metaKeywords,
      metaDescription: product.metaDescription,
      thumbnail: product.thumbnail
        ? {
            id: product.thumbnail.id,
            url: product.thumbnail.url,
            mimeType: product.thumbnail.mimeType,
          }
        : null,
      sampleImages: product.sampleImages.map((s) => ({
        id: s.id,
        order: s.order,
        variantId: s.variantId,
        image: {
          id: s.image.id,
          url: s.image.url,
          mimeType: s.image.mimeType,
        },
      })),
      brand: product.brand
        ? {
            id: product.brand.id,
            name: product.brand.name,
            slug: product.brand.slug,
            logo: product.brand.logo
              ? { id: product.brand.logo.id, url: product.brand.logo.url }
              : null,
          }
        : null,
      attributes,
      variants: product.variants.map((v) => {
        const inv = v.inventory;
        const onHand = inv?.quantityOnHand ?? v.quantity;
        const reserved = inv?.quantityReserved ?? 0;
        const availableStock = Math.max(0, onHand - reserved);
        return {
          id: v.id,
          sku: v.sku,
          price: v.price.toString(),
          status: v.status,
          isBase: v.isBase,
          displayImage: v.displayImage
            ? { id: v.displayImage.id, url: v.displayImage.url }
            : null,
          availableStock,
          attributeOptions: v.attributes.map((va) => ({
            attribute: {
              id: va.option.attribute.id,
              name: va.option.attribute.name,
            },
            option: { id: va.option.id, value: va.option.value },
          })),
          sampleImages: v.sampleImages.map((s) => ({
            id: s.id,
            order: s.order,
            image: { id: s.image.id, url: s.image.url },
          })),
        };
      }),
      relatedProducts: related.map((r) => this.toCard(r)),
    };
  }
}
