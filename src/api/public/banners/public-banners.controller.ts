import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { sendResponse } from '@common/helpers/send.response';
import { PrismaService } from '../../../prisma/prisma.service';

@Public()
@Controller('public/banners')
export class PublicBannersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list() {
    const rows = await this.prisma.banner.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { media: { select: { url: true } } },
    });
    const data = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      buttonText: r.buttonText,
      buttonLink: r.buttonLink,
      mediaUrl: r.media?.url ?? null,
    }));
    return sendResponse({ success: true, message: 'Banners retrieved', data });
  }
}
