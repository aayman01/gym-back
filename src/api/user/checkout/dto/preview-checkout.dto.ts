import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { shippingAddressSchema } from './place-order.dto';

export const previewCheckoutSchema = z.object({
  shippingMethodId: z.string().uuid().optional(),
  shippingAddress: shippingAddressSchema.optional(),
  couponCode: z.string().trim().min(1).max(50).optional(),
});

export class PreviewCheckoutDto extends createZodDto(previewCheckoutSchema) {}
