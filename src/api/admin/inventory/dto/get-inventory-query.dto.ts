import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuerySchema } from '@common/dto/pagination-query.dto';

export const getInventoryQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  lowStockOnly: z.coerce.boolean().optional(),
});

export class GetInventoryQueryDto extends createZodDto(getInventoryQuerySchema) {}
