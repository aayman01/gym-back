import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuerySchema } from './pagination-query.dto';

export const paginatedSearchQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional().describe('Case-insensitive search'),
});

export class PaginatedSearchQueryDto extends createZodDto(
  paginatedSearchQuerySchema,
) {}
