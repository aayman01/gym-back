import { createZodDto } from 'nestjs-zod';
import { ItemStatus } from '@prisma/client';
import { z } from 'zod';

export const createBrandSchema = z.object({
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
  logoId: z.union([z.string().uuid(), z.null()]).optional(),
});

export class CreateBrandDto extends createZodDto(createBrandSchema) {}
