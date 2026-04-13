import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const shippingMethodIdParamSchema = z.object({
  shippingMethodId: z.string().uuid(),
});

export class ShippingMethodIdParamDto extends createZodDto(
  shippingMethodIdParamSchema,
) {}
