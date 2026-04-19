import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const categorySlugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Invalid slug'),
});

export class CategorySlugParamDto extends createZodDto(categorySlugParamSchema) {}
