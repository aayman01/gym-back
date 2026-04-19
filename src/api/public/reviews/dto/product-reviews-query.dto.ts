import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const productReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export class ProductReviewsQueryDto extends createZodDto(
  productReviewsQuerySchema,
) {}
