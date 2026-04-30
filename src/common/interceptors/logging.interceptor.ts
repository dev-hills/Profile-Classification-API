import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap((response) => {
        const responseTime = Date.now() - startTime;

        console.log(
          JSON.stringify({
            method,
            url,
            status: response?.statusCode || 200,
            response_time_ms: responseTime,
            user_id: request.user?.id || null,
          }),
        );
      }),
    );
  }
}
