import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as Minio from 'minio'

@Injectable()
export class StorageService {
  private readonly client: Minio.Client
  private readonly bucket: string
  private readonly endpoint: string
  private readonly port: number
  private readonly useSSL: boolean
  private bucketReady?: Promise<void>

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('MINIO_ENDPOINT') || '127.0.0.1'
    this.port = Number(this.configService.get<number>('MINIO_PORT') || 9000)
    this.useSSL = String(this.configService.get<string>('MINIO_USE_SSL') || 'false') === 'true'
    this.bucket = this.configService.get<string>('MINIO_BUCKET') || 'brickscreen-assets'
    this.client = new Minio.Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin'
    })
  }

  async upload(input: {
    workspaceId: string
    originalName: string
    mime: string
    size: number
    buffer: Buffer
  }) {
    await this.ensureBucket()
    const extension = extname(input.originalName || '') || this.extensionFromMime(input.mime)
    const objectKey = `workspaces/${input.workspaceId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`

    await this.client.putObject(
      this.bucket,
      objectKey,
      input.buffer,
      input.size,
      { 'Content-Type': input.mime }
    )

    return {
      bucket: this.bucket,
      objectKey,
      url: this.publicUrl(objectKey)
    }
  }

  async getObject(objectKey: string) {
    try {
      const stat = await this.client.statObject(this.bucket, objectKey)
      const stream = await this.client.getObject(this.bucket, objectKey)

      return {
        stream,
        mime: stat.metaData?.['content-type'],
        size: stat.size
      }
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === 'NoSuchKey' || code === 'NotFound') {
        throw new NotFoundException('Asset file not found')
      }
      throw error
    }
  }

  private ensureBucket() {
    if (!this.bucketReady) {
      this.bucketReady = (async () => {
        const exists = await this.client.bucketExists(this.bucket)
        if (!exists) {
          await this.client.makeBucket(this.bucket)
        }
      })()
    }

    return this.bucketReady
  }

  private publicUrl(objectKey: string) {
    const baseUrl = this.configService.get<string>('ASSET_PUBLIC_BASE_URL') || '/api/assets/public'
    return `${baseUrl.replace(/\/$/, '')}/${this.encodeObjectKey(objectKey)}`
  }

  private encodeObjectKey(objectKey: string) {
    return objectKey.split('/').map(segment => encodeURIComponent(segment)).join('/')
  }

  private extensionFromMime(mime: string) {
    const map: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/svg+xml': '.svg',
      'application/json': '.json',
      'video/mp4': '.mp4',
      'audio/mpeg': '.mp3',
      'font/woff2': '.woff2'
    }
    return map[mime] || ''
  }
}
