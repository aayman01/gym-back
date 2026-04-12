import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Check if it's a missing body error
    const isMissingBody = exception.issues.some(
      (err) => err.code === 'invalid_type' && err.path.length === 0,
    );

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      success: false,
      message: isMissingBody ? 'Request body is required' : 'Validation failed',
      error: {
        issues: exception.issues.map((err) => {
          // Special handling for missing body
          if (err.code === 'invalid_type' && err.path.length === 0) {
            return {
              path: 'body',
              message: 'Request body is required',
            };
          }
          return {
            path: err.path.join('.'),
            message: err.message,
          };
        }),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
