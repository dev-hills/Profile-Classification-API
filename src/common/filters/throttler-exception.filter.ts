import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (exception?.status === 429) {
      return response.status(429).json({
        status: 'error',
        message: 'Too Many Requests',
      });
    }

    return response.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}
