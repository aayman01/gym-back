import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const path = req.originalUrl ?? req.url;
    const { method } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const durationMs = Date.now() - start;
          this.logger.log(`${method} ${path} ${res.statusCode} ${durationMs}ms`);
        },
        error: (error: unknown) => {
          const durationMs = Date.now() - start;
          const status =
            error instanceof HttpException ? error.getStatus() : 500;
          const message =
            error instanceof Error ? error.message : 'Unknown error';

          this.logger.warn(
            `${method} ${path} ${status} ${durationMs}ms - ${message}`,
          );
        },
      }),
    );
  }
}
