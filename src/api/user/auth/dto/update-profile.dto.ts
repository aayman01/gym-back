import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(150).optional(),
  lastName: z.string().trim().min(1).max(150).optional(),
  phone: z.string().max(50).optional().nullable(),
});

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
