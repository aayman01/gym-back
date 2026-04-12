import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const categoryIdParamSchema = z.object({
  categoryId: z.string().uuid(),
});

export class CategoryIdParamDto extends createZodDto(categoryIdParamSchema) {}
