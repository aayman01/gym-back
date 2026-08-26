import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createReviewSchema = z.object({
  orderItemId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(5000).optional().nullable(),
});

export class CreateReviewDto extends createZodDto(createReviewSchema) {}
