import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createApp } from './create-app';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const { app } = await createApp();
  const configService = app.get(ConfigService);
  const port =
    configService.get<number>('PORT') ?? Number(process.env.PORT ?? 3000);

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
}

void bootstrap();
