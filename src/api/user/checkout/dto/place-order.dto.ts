import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const shippingAddressSchema = z.object({
  recipientName: z.string().min(1).max(255),
  phone: z.string().min(1).max(50),
  addressLine1: z.string().min(1).max(500),
  addressLine2: z.string().max(500).optional().nullable(),
  city: z.string().min(1).max(255),
  stateOrDivision: z.string().min(1).max(255),
  postalCode: z.string().max(50).optional().nullable(),
  country: z.string().length(2),
});

export const billingAddressSchema = z.object({
  recipientName: z.string().min(1).max(255),
  email: z.email(),
  phone: z.string().min(1).max(50),
  addressLine1: z.string().min(1).max(500),
  addressLine2: z.string().max(500).optional().nullable(),
  city: z.string().min(1).max(255),
  stateOrDivision: z.string().min(1).max(255),
  postalCode: z.string().max(50).optional().nullable(),
  country: z.string().length(2),
});

export const placeOrderSchema = z
  .object({
    paymentMethodId: z.string().uuid(),
    shippingMethodId: z.string().uuid().optional(),
    shippingAddress: shippingAddressSchema.optional(),
    billingAddress: billingAddressSchema,
    notes: z.string().max(2000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.shippingMethodId && !data.shippingAddress) {
      ctx.addIssue({
        code: 'custom',
        message: 'shippingAddress is required when shippingMethodId is provided',
        path: ['shippingAddress'],
      });
    }
  });

export class PlaceOrderDto extends createZodDto(placeOrderSchema) {}
