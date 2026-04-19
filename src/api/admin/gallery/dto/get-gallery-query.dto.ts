import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuerySchema } from '@common/dto/pagination-query.dto';

export const getGalleryQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
});

export class GetGalleryQueryDto extends createZodDto(getGalleryQuerySchema) {}
