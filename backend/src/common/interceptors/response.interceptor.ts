import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common'
import { map, Observable } from 'rxjs'

interface ApiResponse<T> {
  success: true
  code: string
  message: string
  data: T
  requestId?: string
  timestamp: string
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    const request = context.switchToHttp().getRequest<{ id?: string }>()

    return next.handle().pipe(
      map(data => {
        if (data instanceof StreamableFile) return data

        return {
          success: true,
          code: 'OK',
          message: 'success',
          data,
          requestId: request.id,
          timestamp: new Date().toISOString()
        }
      })
    )
  }
}
