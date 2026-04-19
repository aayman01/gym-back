import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const publicRegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(150),
  lastName: z.string().min(1).max(150),
  phone: z.string().max(50).optional().nullable(),
});

export class PublicRegisterDto extends createZodDto(publicRegisterSchema) {}
