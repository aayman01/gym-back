import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const variantIdInventoryParamSchema = z.object({
  variantId: z.string().uuid(),
});

export class VariantIdInventoryParamDto extends createZodDto(
  variantIdInventoryParamSchema,
) {}
