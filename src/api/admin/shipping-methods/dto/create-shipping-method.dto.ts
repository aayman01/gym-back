import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createShippingMethodSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  price: z.number().nonnegative(),
  deliveryDays: z.number().int().nonnegative(),
  isActive: z.boolean().optional().default(true),
});

export class CreateShippingMethodDto extends createZodDto(
  createShippingMethodSchema,
) {}
