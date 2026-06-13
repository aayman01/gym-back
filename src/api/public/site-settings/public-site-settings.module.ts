import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SiteSettingsCacheModule } from './site-settings-cache.module';
import { PublicSiteSettingsController } from './public-site-settings.controller';
import { PublicSiteSettingsService } from './public-site-settings.service';

@Module({
  imports: [PrismaModule, SiteSettingsCacheModule],
  controllers: [PublicSiteSettingsController],
  providers: [PublicSiteSettingsService],
  exports: [PublicSiteSettingsService],
})
export class PublicSiteSettingsModule {}
