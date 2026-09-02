import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ZodExceptionFilter } from '@common/filters/zod-exception.filter';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json, type Request, type Response } from 'express';

const logger = new Logger('Bootstrap');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getDatabaseDriverError(error: unknown): {
  kind?: string;
  db?: string;
} | null {
  if (!isRecord(error)) return null;

  const { meta } = error;
  if (!isRecord(meta)) return null;

  const { driverAdapterError } = meta;
  if (!isRecord(driverAdapterError)) return null;

  const { cause } = driverAdapterError;
  if (!isRecord(cause)) return null;

  return {
    kind: typeof cause.kind === 'string' ? cause.kind : undefined,
    db: typeof cause.db === 'string' ? cause.db : undefined,
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    bodyParser: false,
  });

  // Security
  app.use(helmet());
  app.use(cookieParser());
  app.use(json({ limit: '12mb' }));

  // Global filters
  app.useGlobalFilters(new ZodExceptionFilter());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Resolve services
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? Number(process.env.PORT ?? 3000);
  const allowedOrigins = configService.get<string[]>('ALLOWED_ORIGINS')!;

  // CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-xsrf-token',
      'x-guest-token',
      'x-customer-id',
    ],
  });

  app.getHttpAdapter().get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Verify database connection
  const prismaService = app.get(PrismaService);
  try {
    await prismaService.$queryRaw`SELECT 1`;
    logger.log('Database connection established successfully');
  } catch (error: unknown) {
    logger.error('Database connection failed');

    const driverError = getDatabaseDriverError(error);
    if (driverError?.kind === 'DatabaseDoesNotExist') {
      logger.error(
        `Database "${driverError.db}" does not exist. Please check your DATABASE_URL environment variable.`,
      );
    } else {
      logger.error(error instanceof Error ? error.message : String(error));
    }

    throw error instanceof Error
      ? error
      : new Error('Database connection failed during bootstrap');
  }

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
}

void bootstrap();
