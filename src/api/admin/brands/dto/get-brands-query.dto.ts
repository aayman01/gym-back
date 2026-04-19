import { createZodDto } from 'nestjs-zod';
import { ItemStatus } from '@prisma/client';
import { z } from 'zod';
import { paginatedSearchQuerySchema } from '@common/dto/paginated-search-query.dto';

export const getBrandsQuerySchema = paginatedSearchQuerySchema.extend({
  status: z.nativeEnum(ItemStatus).optional(),
});

export class GetBrandsQueryDto extends createZodDto(getBrandsQuerySchema) {}
