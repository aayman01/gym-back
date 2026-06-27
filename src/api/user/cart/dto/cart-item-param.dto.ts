import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const cartItemParamSchema = z.object({
  itemId: z.string().uuid(),
});

export class CartItemParamDto extends createZodDto(cartItemParamSchema) {}
