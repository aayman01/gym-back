import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementDirection,
  InventoryTransactionType,
  ItemStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { IPaginatedResponse } from '@common/types/pagination.types';
import { AdminMediaReserveService } from '../media/admin-media-reserve.service';
import type { UpdateProductDto } from './dto/update-product.dto';
import {
  createProductSchema,
  type CreateProductDto,
} from './dto/create-product.dto';
import { GetAdminProductsQueryDto } from './dto/get-admin-products-query.dto';

const productInclude = {
  thumbnail: true,
  brand: true,
  category: true,
  secondaryCategories: { include: { category: true } },
  tax: true,
  sampleImages: {
    orderBy: [{ order: 'asc' as const }],
    include: { image: true },
  },
  variants: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      displayImage: true,
      attributes: {
        include: {
          option: { include: { attribute: true } },
        },
      },
      inventory: true,
      sampleImages: {
        orderBy: { order: 'asc' as const },
        include: { image: true },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductAdminDetail = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

@Injectable()
export class ProductsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaReserve: AdminMediaReserveService,
  ) {}

  private async validateAttributesAndOptions(
    attributes: NonNullable<CreateProductDto['attributes']>,
  ) {
    if (!attributes?.length) return;
    const optionIds = attributes.flatMap((a) => a.optionIds);
    const options = await this.prisma.productAttributeOption.findMany({
      where: { id: { in: optionIds } },
      include: { attribute: true },
    });
    if (options.length !== optionIds.length) {
      throw new NotFoundException('Some attribute options are not available');
    }
    const optionToAttribute = new Map(
      options.map((o) => [o.id, o.attributeId] as const),
    );
    for (const attr of attributes) {
      for (const optionId of attr.optionIds) {
        if (optionToAttribute.get(optionId) !== attr.attributeId) {
          throw new ConflictException(
            `Option ${optionId} does not belong to attribute ${attr.attributeId}`,
          );
        }
      }
    }
  }

  private collectMediaIds(dto: CreateProductDto): string[] {
    const ids: string[] = [];
    if (dto.thumbnailId) ids.push(dto.thumbnailId);
    if (dto.productGalleryImageIds?.length) {
      ids.push(...dto.productGalleryImageIds);
    }
    const allVariants = dto.variants
      ? dto.variants
      : dto.baseVariant
        ? [dto.baseVariant]
        : [];
    for (const v of allVariants) {
      if (v.displayImageId) ids.push(v.displayImageId);
      if (v.galleryImageIds?.length) ids.push(...v.galleryImageIds);
    }
    return ids;
  }

  private async createVariantMatrix(
    adminId: string,
    productId: string,
    dto: CreateProductDto,
    tx: Prisma.TransactionClient,
  ) {
    const allVariants = dto.variants
      ? dto.variants
      : dto.baseVariant
        ? [dto.baseVariant]
        : [];
    if (allVariants.length === 0) return;

    const skus = allVariants.map((v) => v.sku);
    const existing = await tx.productVariant.findMany({
      where: { productId, sku: { in: skus } },
    });
    if (existing.length > 0) {
      throw new ConflictException(
        `Variant SKUs already exist for this product: ${existing.map((e) => e.sku).join(', ')}`,
      );
    }

    const isMulti = Boolean(dto.variants?.length);

    for (let index = 0; index < allVariants.length; index++) {
      const v = allVariants[index];
      const isBase = dto.baseVariant
        ? true
        : isMulti
          ? index === 0
          : true;

      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku: v.sku,
          price: new Prisma.Decimal(v.price),
          status: ItemStatus.ACTIVE,
          quantity: v.quantity,
          isBase,
          displayImageId: v.displayImageId ?? null,
        },
      });

      if (dto.variants?.[index]?.optionIds?.length) {
        const opts = dto.variants[index].optionIds;
        await tx.productVariantAttribute.createMany({
          data: opts.map((optionId) => ({
            variantId: variant.id,
            optionId,
          })),
        });
      }

      const qty = v.quantity;
      await tx.inventory.create({
        data: {
          variantId: variant.id,
          quantityOnHand: qty,
          quantityReserved: 0,
        },
      });
      if (qty > 0) {
        await tx.inventoryTransaction.create({
          data: {
            variantId: variant.id,
            movementDirection: InventoryMovementDirection.IN,
            type: InventoryTransactionType.STOCK_IN,
            quantityChange: qty,
            resultingQuantity: qty,
          },
        });
      }

      const gIds = v.galleryImageIds ?? [];
      if (gIds.length > 0) {
        await this.mediaReserve.validateAndReserveManyFromFreshOrGallery(
          adminId,
          gIds,
          tx,
        );
        await tx.productSampleImage.createMany({
          data: gIds.map((imageId, order) => ({
            productId,
            variantId: variant.id,
            imageId,
            order,
          })),
        });
      }
    }
  }

  async create(adminId: string, dto: CreateProductDto) {
    const parsed = createProductSchema.parse(dto);
    if (parsed.attributes?.length) {
      await this.validateAttributesAndOptions(parsed.attributes);
    }

    const mediaIds = this.collectMediaIds(parsed);

    const existingSlug = await this.prisma.product.findFirst({
      where: { slug: parsed.slug, deletedAt: null },
    });
    if (existingSlug) {
      throw new ConflictException('A product with this slug already exists');
    }

    await this.prisma.category.findFirstOrThrow({
      where: { id: parsed.primaryCategoryId, deletedAt: null },
    });

    if (parsed.secondaryCategoryIds?.length) {
      const cats = await this.prisma.category.findMany({
        where: {
          id: { in: parsed.secondaryCategoryIds },
          deletedAt: null,
        },
      });
      if (cats.length !== parsed.secondaryCategoryIds.length) {
        throw new NotFoundException('One or more secondary categories not found');
      }
    }

    return this.prisma.transaction(async (tx) => {
      if (mediaIds.length > 0) {
        await this.mediaReserve.validateAndReserveManyFromFreshOrGallery(
          adminId,
          mediaIds,
          tx,
        );
      }

      const product = await tx.product.create({
        data: {
          categoryId: parsed.primaryCategoryId,
          brandId: parsed.brandId ?? null,
          slug: parsed.slug,
          thumbnailId: parsed.thumbnailId ?? null,
          isFeature: parsed.isFeature ?? false,
          lowStockThreshold: parsed.lowStockThreshold ?? 0,
          tags: parsed.tags ?? [],
          type: parsed.type ?? undefined,
          status: parsed.status ?? ItemStatus.ACTIVE,
          sellingUnit: parsed.sellingUnit ?? undefined,
          basePrice: new Prisma.Decimal(parsed.basePrice),
          taxId: parsed.taxId ?? null,
          isTaxIncluded: parsed.isTaxIncluded ?? false,
          isFragile: parsed.isFragile ?? false,
          isPerishable: parsed.isPerishable ?? false,
          title: parsed.title,
          summary: parsed.summary ?? null,
          description: parsed.description ?? null,
          metaTitle: parsed.metaTitle ?? null,
          metaKeywords: parsed.metaKeywords ?? null,
          metaDescription: parsed.metaDescription ?? null,
        },
      });

      if (parsed.secondaryCategoryIds?.length) {
        await tx.productSecondaryCategory.createMany({
          data: parsed.secondaryCategoryIds.map((categoryId) => ({
            productId: product.id,
            categoryId,
          })),
        });
      }

      if (parsed.productGalleryImageIds?.length) {
        await tx.productSampleImage.createMany({
          data: parsed.productGalleryImageIds.map((imageId, order) => ({
            productId: product.id,
            variantId: null,
            imageId,
            order,
          })),
        });
      }

      await this.createVariantMatrix(adminId, product.id, parsed, tx);

      return tx.product.findFirstOrThrow({
        where: { id: product.id },
        include: productInclude,
      });
    });
  }

  async findAll(
    query: GetAdminProductsQueryDto,
  ): Promise<IPaginatedResponse<ProductAdminDetail>> {
    const {
      page,
      limit,
      search,
      categoryId,
      brandId,
      status,
      type,
      sellingUnit,
      minRating,
      minBasePrice,
      maxBasePrice,
      minPrice,
      maxPrice,
    } = query;
    const offset = PaginationHelper.getOffset(page, limit);

    const filters: Prisma.ProductWhereInput[] = [{ deletedAt: null }];

    if (categoryId) filters.push({ categoryId });
    if (brandId) filters.push({ brandId });
    if (status) filters.push({ status });
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

    const where: Prisma.ProductWhereInput = { AND: filters };

    const [total, rows] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: productInclude,
      }),
    ]);

    return PaginationHelper.formatResponse(rows, total, page, limit);
  }

  async findOne(productId: string): Promise<ProductAdminDetail> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(adminId: string, productId: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: {
        secondaryCategories: true,
        variants: {
          include: {
            attributes: true,
            sampleImages: true,
            inventory: true,
          },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const matrixUpdate =
      dto.attributes !== undefined ||
      dto.variants !== undefined ||
      dto.baseVariant !== undefined;

    if (matrixUpdate) {
      if (dto.baseVariant) {
        if (dto.attributes?.length || dto.variants?.length) {
          throw new BadRequestException(
            'Cannot mix baseVariant with attributes/variants',
          );
        }
      } else {
        if (!dto.attributes?.length || !dto.variants?.length) {
          throw new BadRequestException(
            'Replacing variant matrix requires `attributes` and `variants` (or `baseVariant` only)',
          );
        }
      }

      const merged: CreateProductDto = createProductSchema.parse({
        thumbnailId: dto.thumbnailId ?? existing.thumbnailId,
        brandId: dto.brandId ?? existing.brandId,
        primaryCategoryId: dto.primaryCategoryId ?? existing.categoryId,
        secondaryCategoryIds:
          dto.secondaryCategoryIds ??
          existing.secondaryCategories.map((s) => s.categoryId),
        slug: dto.slug ?? existing.slug,
        status: dto.status ?? existing.status,
        basePrice: dto.basePrice ?? Number(existing.basePrice),
        type: dto.type ?? existing.type,
        isFeature: dto.isFeature ?? existing.isFeature,
        sellingUnit: dto.sellingUnit ?? existing.sellingUnit,
        lowStockThreshold: dto.lowStockThreshold ?? existing.lowStockThreshold,
        tags: dto.tags ?? existing.tags,
        title: dto.title ?? existing.title,
        summary: dto.summary !== undefined ? dto.summary : existing.summary,
        description:
          dto.description !== undefined ? dto.description : existing.description,
        metaTitle:
          dto.metaTitle !== undefined ? dto.metaTitle : existing.metaTitle,
        metaKeywords:
          dto.metaKeywords !== undefined
            ? dto.metaKeywords
            : existing.metaKeywords,
        metaDescription:
          dto.metaDescription !== undefined
            ? dto.metaDescription
            : existing.metaDescription,
        taxId: dto.taxId !== undefined ? dto.taxId : existing.taxId,
        isTaxIncluded: dto.isTaxIncluded ?? existing.isTaxIncluded,
        isFragile: dto.isFragile ?? existing.isFragile,
        isPerishable: dto.isPerishable ?? existing.isPerishable,
        productGalleryImageIds:
          dto.productGalleryImageIds ??
          (
            await this.prisma.productSampleImage.findMany({
              where: { productId, variantId: null },
              orderBy: { order: 'asc' },
            })
          ).map((s) => s.imageId),
        attributes: dto.baseVariant ? [] : dto.attributes!,
        variants: dto.baseVariant ? undefined : dto.variants!,
        baseVariant: dto.baseVariant,
      });

      const mediaIds = this.collectMediaIds(merged);
      if (merged.attributes?.length) {
        await this.validateAttributesAndOptions(merged.attributes);
      }

      if (dto.slug && dto.slug !== existing.slug) {
        const slugTaken = await this.prisma.product.findFirst({
          where: { slug: dto.slug, deletedAt: null, NOT: { id: productId } },
        });
        if (slugTaken) {
          throw new ConflictException('A product with this slug already exists');
        }
      }

      return this.prisma.transaction(async (tx) => {
        if (mediaIds.length > 0) {
          await this.mediaReserve.validateAndReserveManyFromFreshOrGallery(
            adminId,
            mediaIds,
            tx,
          );
        }

        await tx.productVariant.deleteMany({ where: { productId } });
        await tx.productSampleImage.deleteMany({ where: { productId } });

        await tx.product.update({
          where: { id: productId },
          data: {
            categoryId: merged.primaryCategoryId,
            brandId: merged.brandId,
            slug: merged.slug,
            thumbnailId: merged.thumbnailId,
            isFeature: merged.isFeature,
            lowStockThreshold: merged.lowStockThreshold,
            tags: merged.tags,
            type: merged.type,
            status: merged.status,
            sellingUnit: merged.sellingUnit,
            basePrice: new Prisma.Decimal(merged.basePrice),
            taxId: merged.taxId,
            isTaxIncluded: merged.isTaxIncluded,
            isFragile: merged.isFragile,
            isPerishable: merged.isPerishable,
            title: merged.title,
            summary: merged.summary,
            description: merged.description,
            metaTitle: merged.metaTitle,
            metaKeywords: merged.metaKeywords,
            metaDescription: merged.metaDescription,
          },
        });

        await tx.productSecondaryCategory.deleteMany({ where: { productId } });
        if (merged.secondaryCategoryIds?.length) {
          await tx.productSecondaryCategory.createMany({
            data: merged.secondaryCategoryIds.map((categoryId) => ({
              productId,
              categoryId,
            })),
          });
        }

        if (merged.productGalleryImageIds?.length) {
          await tx.productSampleImage.createMany({
            data: merged.productGalleryImageIds.map((imageId, order) => ({
              productId,
              variantId: null,
              imageId,
              order,
            })),
          });
        }

        await this.createVariantMatrix(adminId, productId, merged, tx);

        return tx.product.findFirstOrThrow({
          where: { id: productId },
          include: productInclude,
        });
      });
    }

    const mediaIds: string[] = [];
    if (dto.thumbnailId !== undefined && dto.thumbnailId) {
      mediaIds.push(dto.thumbnailId);
    }
    if (dto.productGalleryImageIds !== undefined) {
      mediaIds.push(...dto.productGalleryImageIds);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugTaken = await this.prisma.product.findFirst({
        where: { slug: dto.slug, deletedAt: null, NOT: { id: productId } },
      });
      if (slugTaken) {
        throw new ConflictException('A product with this slug already exists');
      }
    }

    return this.prisma.transaction(async (tx) => {
      if (mediaIds.length > 0) {
        await this.mediaReserve.validateAndReserveManyFromFreshOrGallery(
          adminId,
          mediaIds,
          tx,
        );
      }

      if (dto.productGalleryImageIds !== undefined) {
        await tx.productSampleImage.deleteMany({
          where: { productId, variantId: null },
        });
        if (dto.productGalleryImageIds.length > 0) {
          await tx.productSampleImage.createMany({
            data: dto.productGalleryImageIds.map((imageId, order) => ({
              productId,
              variantId: null,
              imageId,
              order,
            })),
          });
        }
      }

      await tx.product.update({
        where: { id: productId },
        data: {
          ...(dto.primaryCategoryId !== undefined
            ? { categoryId: dto.primaryCategoryId }
            : {}),
          ...(dto.brandId !== undefined ? { brandId: dto.brandId } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.basePrice !== undefined
            ? { basePrice: new Prisma.Decimal(dto.basePrice) }
            : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.isFeature !== undefined ? { isFeature: dto.isFeature } : {}),
          ...(dto.sellingUnit !== undefined
            ? { sellingUnit: dto.sellingUnit }
            : {}),
          ...(dto.lowStockThreshold !== undefined
            ? { lowStockThreshold: dto.lowStockThreshold }
            : {}),
          ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.metaTitle !== undefined ? { metaTitle: dto.metaTitle } : {}),
          ...(dto.metaKeywords !== undefined
            ? { metaKeywords: dto.metaKeywords }
            : {}),
          ...(dto.metaDescription !== undefined
            ? { metaDescription: dto.metaDescription }
            : {}),
          ...(dto.taxId !== undefined ? { taxId: dto.taxId } : {}),
          ...(dto.isTaxIncluded !== undefined
            ? { isTaxIncluded: dto.isTaxIncluded }
            : {}),
          ...(dto.isFragile !== undefined ? { isFragile: dto.isFragile } : {}),
          ...(dto.isPerishable !== undefined
            ? { isPerishable: dto.isPerishable }
            : {}),
          ...(dto.thumbnailId !== undefined
            ? { thumbnailId: dto.thumbnailId }
            : {}),
        },
      });

      if (dto.secondaryCategoryIds !== undefined) {
        await tx.productSecondaryCategory.deleteMany({ where: { productId } });
        if (dto.secondaryCategoryIds.length > 0) {
          await tx.productSecondaryCategory.createMany({
            data: dto.secondaryCategoryIds.map((categoryId) => ({
              productId,
              categoryId,
            })),
          });
        }
      }

      return tx.product.findFirstOrThrow({
        where: { id: productId },
        include: productInclude,
      });
    });
  }

  async softDelete(productId: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    await this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date(), status: ItemStatus.INACTIVE },
    });
    return { deleted: true };
  }
}
