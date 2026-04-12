import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const brandIdParamSchema = z.object({
  brandId: z.string().uuid(),
});

export class BrandIdParamDto extends createZodDto(brandIdParamSchema) {}
