import { createZodDto } from 'nestjs-zod';
import { ItemStatus } from '@prisma/client';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
      'Slug must be URL-safe (letters, numbers, hyphens)',
    ),
  status: z.nativeEnum(ItemStatus).optional().default(ItemStatus.ACTIVE),
  isFeature: z.boolean().optional().default(false),
  imageId: z.string().uuid().optional(),
  order: z.coerce.number().int().optional(),
});

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
