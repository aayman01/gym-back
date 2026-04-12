import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './app_config.service';


@Global()
@Module({
    controllers: [],
    providers: [AppConfigService],
    exports: [AppConfigService],
})
export class AppConfigModule { }
