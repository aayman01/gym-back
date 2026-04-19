import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const syncWishlistSchema = z.object({
  customerId: z.string().uuid(),
});

export class SyncWishlistDto extends createZodDto(syncWishlistSchema) {}
