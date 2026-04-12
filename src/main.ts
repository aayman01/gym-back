import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter';
import helmet from 'helmet';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    rawBody: true,
  });

  // Security
  app.use(helmet());

  // Global filters
  app.useGlobalFilters(new ZodExceptionFilter());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Resolve services
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT')!;
  const allowedOrigins = configService.get<string[]>('ALLOWED_ORIGINS')!;

  // CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Verify database connection
  const prismaService = app.get(PrismaService);
  try {
    await prismaService.$queryRaw`SELECT 1`;
    logger.log('Database connection established successfully');
  } catch (error: any) {
    logger.error('Database connection failed');

    const driverError = error?.meta?.driverAdapterError?.cause;
    if (driverError?.kind === 'DatabaseDoesNotExist') {
      logger.error(
        `Database "${driverError.db}" does not exist. Please check your DATABASE_URL environment variable.`,
      );
    } else {
      logger.error(error.message || error);
    }

    process.exit(1);
  }

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
}

bootstrap();
