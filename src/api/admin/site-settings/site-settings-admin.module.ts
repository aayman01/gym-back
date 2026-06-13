import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SiteSettingsCacheModule } from '../../public/site-settings/site-settings-cache.module';
import { SiteSettingsAdminController } from './site-settings-admin.controller';
import { SiteSettingsAdminService } from './site-settings-admin.service';
import { SiteSettingsRepository } from './site-settings.repository';

@Module({
  imports: [PrismaModule, SiteSettingsCacheModule],
  controllers: [SiteSettingsAdminController],
  providers: [SiteSettingsAdminService, SiteSettingsRepository],
  exports: [SiteSettingsAdminService],
})
export class SiteSettingsAdminModule {}
