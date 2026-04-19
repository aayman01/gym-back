import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const addToWishlistSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
});

export class AddToWishlistDto extends createZodDto(addToWishlistSchema) {}
