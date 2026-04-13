import { createZodDto } from 'nestjs-zod';
import { TaxType } from '@prisma/client';
import { z } from 'zod';

export const updateTaxSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    rate: z.number().nonnegative().optional(),
    type: z.nativeEnum(TaxType).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update',
  );

export class UpdateTaxDto extends createZodDto(updateTaxSchema) {}
