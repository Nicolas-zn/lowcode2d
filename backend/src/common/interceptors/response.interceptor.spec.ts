import { Readable } from 'node:stream'
import { CallHandler, ExecutionContext, StreamableFile } from '@nestjs/common'
import { lastValueFrom, of } from 'rxjs'
import { ResponseInterceptor } from './response.interceptor'

describe('ResponseInterceptor', () => {
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ id: 'request_1' })
    })
  } as ExecutionContext

  it('wraps regular API data', async () => {
    const interceptor = new ResponseInterceptor()
    const result = await lastValueFrom(interceptor.intercept(context, {
      handle: () => of({ id: 'item_1' })
    } as CallHandler))

    expect(result).toEqual(expect.objectContaining({
      success: true,
      code: 'OK',
      data: { id: 'item_1' },
      requestId: 'request_1'
    }))
  })

  it('does not JSON-wrap StreamableFile responses', async () => {
    const interceptor = new ResponseInterceptor()
    const file = new StreamableFile(Readable.from(Buffer.from('image')))
    const result = await lastValueFrom(interceptor.intercept(context, {
      handle: () => of(file)
    } as CallHandler))

    expect(result).toBe(file)
  })
})
