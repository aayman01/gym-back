import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const submitContactSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().max(50).optional().nullable(),
    subject: z.string().trim().max(255).optional().nullable(),
    message: z.string().trim().min(1).max(5000),
    /** Honeypot — bots fill this; humans leave empty */
    website: z.string().max(200).optional().nullable(),
  })
  .strict();

export class SubmitContactDto extends createZodDto(submitContactSchema) {}
