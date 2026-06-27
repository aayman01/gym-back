import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const addOrderNoteSchema = z.object({
  note: z.string().min(1).max(1000),
});

export class AddOrderNoteDto extends createZodDto(addOrderNoteSchema) {}
