import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  buyNow: z.coerce.boolean().optional().default(false),
});

export class AddToCartDto extends createZodDto(addToCartSchema) {}
