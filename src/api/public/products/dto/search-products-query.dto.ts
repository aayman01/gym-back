import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuerySchema } from '@common/dto/pagination-query.dto';

export const searchProductsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).max(100),
});

export class SearchProductsQueryDto extends createZodDto(searchProductsQuerySchema) {}
