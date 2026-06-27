import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const addressParamSchema = z.object({
  addressId: z.string().uuid(),
});

export class AddressParamDto extends createZodDto(addressParamSchema) {}
