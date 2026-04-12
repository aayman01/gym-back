import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const variantIdParamSchema = z.object({
  variantId: z.string().uuid(),
});

export class VariantIdParamDto extends createZodDto(variantIdParamSchema) {}
