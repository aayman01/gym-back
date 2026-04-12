import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ZodError } from 'zod';
import { AppConfigService } from 'src/config/app_config/app_config.service';

export interface ApiResponse<T> {
    statusCode: number;
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
    timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>> {
    constructor(private readonly configService: AppConfigService) { }

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const statusCode = response.statusCode;

        return next.handle().pipe(
            map((data) => {
                // Handle null/undefined data for 204 responses
                if (statusCode === HttpStatus.NO_CONTENT) {
                    return {
                        statusCode,
                        success: true,
                        timestamp: new Date().toISOString(),
                    };
                }

                // Handle error responses
                if (statusCode >= 400) {
                    // Handle Zod validation errors
                    if (data instanceof ZodError) {
                        return {
                            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            success: false,
                            message: 'Validation failed',
                            error: {
                                issues: data.issues.map((err) => ({
                                    path: err.path.join('.'),
                                    message: err.message,
                                })),
                            },
                            timestamp: new Date().toISOString(),
                        };
                    }

                    const isProduction = this.configService.nodeEnv === 'production';

                    return {
                        statusCode,
                        success: false,
                        message: data?.message || 'An error occurred',
                        error: isProduction ? null : data?.error,
                        timestamp: new Date().toISOString(),
                    };
                }

                // Handle success responses
                const { message, data: dataResponse, ...rest } = data || {};
                return {
                    statusCode,
                    success: true,
                    data: dataResponse,
                    message,
                    ...rest,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
}
