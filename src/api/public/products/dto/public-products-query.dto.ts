import { createZodDto } from 'nestjs-zod';
import { ProductType, SellingUnit } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '../../../../common/dto/pagination-query.dto';

export const getPublicProductsQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  type: z.nativeEnum(ProductType).optional(),
  sellingUnit: z.nativeEnum(SellingUnit).optional(),
  minBasePrice: z.coerce.number().min(0).optional(),
  maxBasePrice: z.coerce.number().min(0).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export class GetPublicProductsQueryDto extends createZodDto(
  getPublicProductsQuerySchema,
) {}
