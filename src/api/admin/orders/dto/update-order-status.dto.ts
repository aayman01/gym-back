import { createZodDto } from 'nestjs-zod';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export class UpdateOrderStatusDto extends createZodDto(
  updateOrderStatusSchema,
) {}
