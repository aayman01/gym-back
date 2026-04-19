import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Redirect,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '@common/decorators/public.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('public/media')
export class PublicMediaController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get(':mediaId/content')
  @Redirect(undefined, 302)
  async serve(
    @Param('mediaId') mediaId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const media = await this.prisma.adminMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    res.redirect(media.url);
  }
}
