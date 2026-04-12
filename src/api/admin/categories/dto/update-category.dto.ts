import { createZodDto } from 'nestjs-zod';
import { ItemStatus } from '@prisma/client';
import { z } from 'zod';

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
        'Slug must be URL-safe (letters, numbers, hyphens)',
      )
      .optional(),
    status: z.nativeEnum(ItemStatus).optional(),
    isFeature: z.boolean().optional(),
    imageId: z.union([z.string().uuid(), z.null()]).optional(),
    order: z.coerce.number().int().optional(),
  })
  .strict();

export class UpdateCategoryDto extends createZodDto(updateCategorySchema) {}
