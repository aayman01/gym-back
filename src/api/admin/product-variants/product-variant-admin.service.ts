import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ProductVariantRepository,
  ProductVariantAdminPayload,
} from './product-variant.repository';
import { PaginationHelper } from '../../../common/helpers/pagination.helper';
import { IPaginatedResponse } from '../../../common/types/pagination.types';
import { PaginatedSearchQueryDto } from '../../../common/dto/paginated-search-query.dto';

export type ProductVariantAdminListItem = {
  id: string;
  productId: string;
  sku: string;
  price: ProductVariantAdminPayload['price'];
  status: string;
  quantity: number;
  isBase: boolean;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    slug: string;
    title: string;
    thumbnailUrl: string | null;
  };
  attributeOptions: {
    attribute: { id: string; name: string };
    option: { id: string; value: string; displayOrder: number };
  }[];
  inventory: { quantityOnHand: number; quantityReserved: number };
};

@Injectable()
export class ProductVariantAdminService {
  constructor(
    private readonly productVariantRepository: ProductVariantRepository,
  ) {}

  async findAll(
    query: PaginatedSearchQueryDto,
  ): Promise<IPaginatedResponse<ProductVariantAdminListItem>> {
    const { page, limit, search } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where = this.productVariantRepository.buildListWhere(search);

    const [total, rows] = await Promise.all([
      this.productVariantRepository.count(where),
      this.productVariantRepository.findManyPaginated(where, offset, limit),
    ]);

    const data = rows.map((v) => this.mapVariant(v));
    return PaginationHelper.formatResponse(data, total, page, limit);
  }

  async findOne(variantId: string): Promise<ProductVariantAdminListItem> {
    const variant = await this.productVariantRepository.findOneById(variantId);

    if (!variant || variant.product.deletedAt != null) {
      throw new NotFoundException('Variant not found');
    }

    return this.mapVariant(variant);
  }

  private mapVariant(
    variant: ProductVariantAdminPayload,
  ): ProductVariantAdminListItem {
    const { productId, attributes, inventory, product, ...variantScalars } =
      variant;

    return {
      ...variantScalars,
      productId,
      product: {
        id: product.id,
        slug: product.slug,
        title: product.title,
        thumbnailUrl: product.thumbnail?.url ?? null,
      },
      attributeOptions: attributes.map((row) => ({
        attribute: {
          id: row.option.attribute.id,
          name: row.option.attribute.name,
        },
        option: {
          id: row.option.id,
          value: row.option.value,
          displayOrder: row.option.order,
        },
      })),
      inventory: inventory
        ? {
            quantityOnHand: inventory.quantityOnHand,
            quantityReserved: inventory.quantityReserved,
          }
        : { quantityOnHand: 0, quantityReserved: 0 },
    };
  }
}
