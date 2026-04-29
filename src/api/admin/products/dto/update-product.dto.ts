import { createZodDto } from 'nestjs-zod';
import { productBaseSchema } from './create-product.dto';

/** Partial update; variant matrix validation is applied in the service when those fields are present. */
export const updateProductSchema = productBaseSchema.partial();

export class UpdateProductDto extends createZodDto(updateProductSchema) {}
