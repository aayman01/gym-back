import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive().optional(),
  isSelected: z.boolean().optional(),
});

export class UpdateCartItemDto extends createZodDto(updateCartItemSchema) {}
