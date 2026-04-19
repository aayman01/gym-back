import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adminOrderIdParamSchema = z.object({
  orderId: z.string().uuid(),
});

export class AdminOrderIdParamDto extends createZodDto(
  adminOrderIdParamSchema,
) {}
