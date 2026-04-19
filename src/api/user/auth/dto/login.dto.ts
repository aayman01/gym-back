import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const publicLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export class PublicLoginDto extends createZodDto(publicLoginSchema) {}
