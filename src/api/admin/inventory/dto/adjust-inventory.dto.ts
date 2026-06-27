import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adjustInventorySchema = z.object({
  type: z.enum(['STOCK_IN', 'STOCK_OUT']),
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  reason: z.string().max(500).optional().nullable(),
});

export class AdjustInventoryDto extends createZodDto(adjustInventorySchema) {}
