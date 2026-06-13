import { Global, Module } from '@nestjs/common';
import { SiteSettingsCacheService } from './site-settings-cache.service';

@Global()
@Module({
  providers: [SiteSettingsCacheService],
  exports: [SiteSettingsCacheService],
})
export class SiteSettingsCacheModule {}
