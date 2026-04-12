import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createAttributeOptionSchema = z.object({
  value: z.string().trim().min(1, 'Option value is required').max(255),
});

export const createAttributeBaseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  options: z.array(createAttributeOptionSchema).optional().default([]),
});

export const createProductAttributeSchema = createAttributeBaseSchema.refine(
  (data) => {
    const values = data.options?.map((opt) => opt.value) ?? [];
    return new Set(values).size === values.length;
  },
  {
    message: 'Duplicate option values are not allowed',
    path: ['options'],
  },
);

export class CreateProductAttributeDto extends createZodDto(
  createProductAttributeSchema,
) {}
