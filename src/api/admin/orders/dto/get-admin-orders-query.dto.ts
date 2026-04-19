import { createZodDto } from 'nestjs-zod';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

export const getAdminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

export class GetAdminOrdersQueryDto extends createZodDto(
  getAdminOrdersQuerySchema,
) {}
