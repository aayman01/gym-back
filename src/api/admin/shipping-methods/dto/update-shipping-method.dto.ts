import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateShippingMethodSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    price: z.number().nonnegative().optional(),
    deliveryDays: z.number().int().nonnegative().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update',
  );

export class UpdateShippingMethodDto extends createZodDto(
  updateShippingMethodSchema,
) {}
