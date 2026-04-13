import { createZodDto } from 'nestjs-zod';
import { TaxType } from '@prisma/client';
import { z } from 'zod';

export const createTaxSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  rate: z.number().nonnegative(),
  type: z.nativeEnum(TaxType),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export class CreateTaxDto extends createZodDto(createTaxSchema) {}
