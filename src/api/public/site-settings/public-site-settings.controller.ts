import { Controller, Get, Header, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { sendResponse } from '@common/helpers/send.response';
import { PublicSiteSettingsService } from './public-site-settings.service';

@Public()
@Controller('public/site-settings')
export class PublicSiteSettingsController {
  constructor(
    private readonly publicSiteSettingsService: PublicSiteSettingsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async get() {
    const data = await this.publicSiteSettingsService.getPublicSettings();
    return sendResponse({
      success: true,
      message: 'Site settings retrieved successfully',
      data,
    });
  }
}
