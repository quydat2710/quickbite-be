import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../dto/api-response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Đã xảy ra lỗi, vui lòng thử lại sau';
    let details: any[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || message;
        code = resp.error || code;

        // class-validator errors
        if (Array.isArray(resp.message)) {
          details = resp.message;
          message = 'Dữ liệu không hợp lệ';
          code = 'VALIDATION_ERROR';
        }
      }

      // Map common HTTP codes to error codes
      if (status === 401) code = 'UNAUTHORIZED';
      if (status === 403) code = 'FORBIDDEN';
      if (status === 404) code = 'NOT_FOUND';
      if (status === 409) code = 'CONFLICT';
      if (status === 429) code = 'RATE_LIMIT_EXCEEDED';
    } else {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json(ApiResponse.error(code, message, details));
  }
}
