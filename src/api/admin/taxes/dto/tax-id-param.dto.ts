import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const taxIdParamSchema = z.object({
  taxId: z.string().uuid(),
});

export class TaxIdParamDto extends createZodDto(taxIdParamSchema) {}
