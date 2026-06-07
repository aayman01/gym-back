import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { sendResponse } from '../helpers/send.response';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const path = req.originalUrl ?? req.url;
    const method = req.method;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: unknown = null;

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';

      const zodError = exception.getZodError() as ZodError;
      error = zodError?.issues ?? null;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
        error = null;
      } else if (typeof response === 'object' && response !== null) {
        const r = response as { message?: string | string[] };
        message = Array.isArray(r.message)
          ? r.message.join(', ')
          : (r.message ?? message);
        error = exception.stack;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.stack ?? exception;
    } else {
      error = exception;
    }

    const logMessage = `${method} ${path} ${status} - ${message}`;

    if (status >= 500) {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }

    return res
      .status(status)
      .json(sendResponse({ success: false, message, error }));
  }
}
