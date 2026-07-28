import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(request: Request & { id?: string }, response: Response, next: NextFunction) {
    const startedAt = Date.now()

    response.on('finish', () => {
      const duration = Date.now() - startedAt
      this.logger.log(JSON.stringify({
        event: 'http.request',
        requestId: request.id || '-',
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: duration,
        userAgent: request.header('user-agent') || null,
        ip: request.ip
      }))
    })

    next()
  }
}
