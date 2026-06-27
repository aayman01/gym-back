import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().max(100).optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  recipientName: z.string().min(1).max(255),
  phone: z.string().min(1).max(50),
  addressLine1: z.string().min(1).max(500),
  addressLine2: z.string().max(500).optional().nullable(),
  city: z.string().min(1).max(255),
  stateOrDivision: z.string().min(1).max(255),
  postalCode: z.string().max(50).optional().nullable(),
  country: z.string().length(2),
});

export const updateAddressSchema = createAddressSchema.partial();

export class CreateAddressDto extends createZodDto(createAddressSchema) {}
export class UpdateAddressDto extends createZodDto(updateAddressSchema) {}
