import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from '../env.schema';


@Injectable()
export class AppConfigService {
    constructor(private readonly configService: ConfigService) { }

    // === App ===
    get nodeEnv(): AppEnv['NODE_ENV'] {
        return this.configService.getOrThrow('NODE_ENV');
    }

    get port(): AppEnv['PORT'] {
        return this.configService.getOrThrow('PORT');
    }

    get databaseUrl(): AppEnv['DATABASE_URL'] {
        return this.configService.getOrThrow('DATABASE_URL');
    }

    get allowedOrigins(): AppEnv['ALLOWED_ORIGINS'] {
        return this.configService.getOrThrow('ALLOWED_ORIGINS');
    }
}