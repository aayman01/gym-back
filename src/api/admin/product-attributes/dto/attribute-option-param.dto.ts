import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const attributeOptionParamSchema = z.object({
  attributeId: z.string().uuid(),
  optionId: z.string().uuid(),
});

export class AttributeOptionParamDto extends createZodDto(attributeOptionParamSchema) {}
