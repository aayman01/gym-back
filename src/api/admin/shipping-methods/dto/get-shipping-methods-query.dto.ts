import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginatedSearchQuerySchema } from '../../../../common/dto/paginated-search-query.dto';

export const getShippingMethodsQuerySchema = paginatedSearchQuerySchema.extend({
  isActive: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .describe('Filter by active status'),
});

export class GetShippingMethodsQueryDto extends createZodDto(
  getShippingMethodsQuerySchema,
) {}
