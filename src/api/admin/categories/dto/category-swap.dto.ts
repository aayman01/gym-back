import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const categorySwapSchema = z.object({
  id1: z.string().uuid(),
  id2: z.string().uuid(),
});

export class CategorySwapDto extends createZodDto(categorySwapSchema) {}
