import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';
import { ZodValidationException } from 'nestjs-zod';
import { sendResponse } from '../helpers/send.reponse';


@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: any = null;

    // 🟥 Handle HttpException

    if (exception instanceof ZodValidationException) {
      console.log('Herrrre');
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';

      const zodError = exception?.getZodError() as ZodError;

      error = zodError?.issues || null;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
        error = null;
      } else {
        const r = response as any;
        message = r.message || message;
        error = exception.stack;
      }
    }

    // 🟨 Handle generic errors
    else {
      message = exception?.message || message;
      error = exception;
      console.error('Unhandled Exception →', exception);
    }

    console.log({ error });

    return res
      .status(status)
      .json(sendResponse({ success: false, message, error }));
  }
}
