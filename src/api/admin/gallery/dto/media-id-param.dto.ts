import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const mediaIdParamSchema = z.object({
  mediaId: z.string().uuid(),
});

export class MediaIdParamDto extends createZodDto(mediaIdParamSchema) {}
