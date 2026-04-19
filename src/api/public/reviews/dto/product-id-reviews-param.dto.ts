import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const productIdReviewsParamSchema = z.object({
  productId: z.string().uuid(),
});

export class ProductIdReviewsParamDto extends createZodDto(
  productIdReviewsParamSchema,
) {}
