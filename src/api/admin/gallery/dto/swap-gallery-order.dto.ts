import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const swapGalleryOrderSchema = z.object({
  mediaId1: z.string().uuid(),
  mediaId2: z.string().uuid(),
});

export class SwapGalleryOrderDto extends createZodDto(swapGalleryOrderSchema) {}
