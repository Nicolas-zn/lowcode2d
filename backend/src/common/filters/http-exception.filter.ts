import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP_EXCEPTION')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<{ id?: string; url?: string }>()
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    const exceptionResponse = exception instanceof HttpException
      ? exception.getResponse()
      : null
    const message = typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse
      ? (exceptionResponse as { message: string | string[] }).message
      : exception instanceof Error
        ? exception.message
        : 'Internal server error'

    this.logger.error(JSON.stringify({
      event: 'http.exception',
      requestId: request.id,
      statusCode: status,
      path: request.url,
      code: exception instanceof HttpException ? exception.name : 'InternalServerError',
      message
    }))

    response.status(status).json({
      success: false,
      code: exception instanceof HttpException ? exception.name : 'InternalServerError',
      message,
      data: null,
      path: request.url,
      requestId: request.id,
      timestamp: new Date().toISOString()
    })
  }
}
