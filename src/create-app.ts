import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Logger, type INestApplication } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ZodExceptionFilter } from '@common/filters/zod-exception.filter';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import express, {
  json,
  type Express,
  type Request,
  type Response,
} from 'express';

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

export async function createApp(): Promise<{
  app: INestApplication;
  expressApp: Express;
}> {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
      bodyParser: false,
    },
  );

  app.use(helmet());
  app.use(cookieParser());
  app.use(json({ limit: '12mb' }));
  app.useGlobalFilters(new ZodExceptionFilter());
  app.setGlobalPrefix('api/v1');

  const configService = app.get(ConfigService);
  const allowedOrigins = configService.get<string[]>('ALLOWED_ORIGINS')!;

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
      message: 'Service is healthy',
      service: 'gym-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

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

  await app.init();

  return { app, expressApp };
}
