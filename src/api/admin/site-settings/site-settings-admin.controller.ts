import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { SiteSettingsAdminService } from './site-settings-admin.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

@Controller('admin/site-settings')
export class SiteSettingsAdminController {
  constructor(private readonly siteSettingsAdminService: SiteSettingsAdminService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async get() {
    const data = await this.siteSettingsAdminService.getOrCreate();
    return sendResponse({
      success: true,
      message: 'Site settings retrieved successfully',
      data,
    });
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  async update(@Body() body: UpdateSiteSettingsDto) {
    const data = await this.siteSettingsAdminService.update(body);
    return sendResponse({
      success: true,
      message: 'Site settings updated successfully',
      data,
    });
  }
}
