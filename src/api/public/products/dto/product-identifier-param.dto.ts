import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
    'Identifier must be a UUID or URL-safe slug',
  );

export const productIdentifierParamSchema = z.object({
  identifier: z.union([z.string().uuid(), slugSchema]),
});

export class ProductIdentifierParamDto extends createZodDto(
  productIdentifierParamSchema,
) {}
