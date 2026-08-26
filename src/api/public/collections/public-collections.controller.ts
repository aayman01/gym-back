import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { sendResponse } from '@common/helpers/send.response';
import { PublicCollectionsService } from './public-collections.service';

@Public()
@Controller('public/collections')
export class PublicCollectionsController {
  constructor(private readonly collections: PublicCollectionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list() {
    const data = await this.collections.findAll();
    return sendResponse({ success: true, message: 'Collections retrieved', data });
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async detail(@Param('slug') slug: string) {
    const data = await this.collections.findBySlug(slug);
    return sendResponse({ success: true, message: 'Collection retrieved', data });
  }
}
