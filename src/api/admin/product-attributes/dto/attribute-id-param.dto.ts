import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const attributeIdParamSchema = z.object({
  attributeId: z.string().uuid(),
});

export class AttributeIdParamDto extends createZodDto(attributeIdParamSchema) {}
