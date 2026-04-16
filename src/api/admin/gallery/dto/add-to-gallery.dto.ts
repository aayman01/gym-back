import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const addToGallerySchema = z.object({
  mediaId: z.string().uuid('Invalid media ID'),
});

export class AddToGalleryDto extends createZodDto(addToGallerySchema) {}
