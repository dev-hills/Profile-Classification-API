import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      console.log({
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        response_time_ms: duration,
      });
    });

    next();
  }
}
