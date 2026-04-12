import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const attributeSwapSchema = z.object({
  id1: z.string().uuid(),
  id2: z.string().uuid(),
});

export class AttributeSwapDto extends createZodDto(attributeSwapSchema) {}
