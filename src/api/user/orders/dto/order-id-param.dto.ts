import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid(),
});

export class OrderIdParamDto extends createZodDto(orderIdParamSchema) {}
