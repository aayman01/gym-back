import { createZodDto } from 'nestjs-zod';
import { createAttributeBaseSchema } from './create-product-attribute.dto';

export const updateProductAttributeSchema = createAttributeBaseSchema.partial();

export class UpdateProductAttributeDto extends createZodDto(
  updateProductAttributeSchema,
) {}
