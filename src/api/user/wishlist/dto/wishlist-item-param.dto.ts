import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const wishlistItemParamSchema = z.object({
  itemId: z.string().uuid(),
});

export class WishlistItemParamDto extends createZodDto(wishlistItemParamSchema) {}
