import { createZodDto } from 'nestjs-zod';
import { ProductType, SellingUnit } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@common/dto/pagination-query.dto';

export const SORT_BY_VALUES = ['updatedAt', 'price', 'rating', 'title'] as const;
export type SortBy = (typeof SORT_BY_VALUES)[number];

export const SORT_ORDER_VALUES = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDER_VALUES)[number];

const slugPreprocess = (v: unknown) => {
  if (v === '' || v === null || v === undefined) return undefined;
  if (typeof v === 'string') return v.trim() || undefined;
  return undefined;
};

export const getPublicProductsQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.preprocess(slugPreprocess, z.string().min(1).optional()),
  brandId: z.string().uuid().optional(),
  brandSlug: z.preprocess(slugPreprocess, z.string().min(1).optional()),
  minRating: z.coerce.number().min(0).max(5).optional(),
  type: z.nativeEnum(ProductType).optional(),
  sellingUnit: z.nativeEnum(SellingUnit).optional(),
  minBasePrice: z.coerce.number().min(0).optional(),
  maxBasePrice: z.coerce.number().min(0).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  isFeature: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .describe('Filter by featured status'),
  sortBy: z.enum(SORT_BY_VALUES).optional().describe('Sort field'),
  sortOrder: z.enum(SORT_ORDER_VALUES).optional().describe('Sort direction'),
});

export class GetPublicProductsQueryDto extends createZodDto(
  getPublicProductsQuerySchema,
) {}
