import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const syncCartSchema = z.object({
  customerId: z.string().uuid(),
});

export class SyncCartDto extends createZodDto(syncCartSchema) {}
