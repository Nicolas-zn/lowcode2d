import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private readonly client: Redis

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379'
    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    })

    this.client.on('error', error => {
      this.logger.warn(`Redis connection error: ${error.message}`)
    })
  }

  getClient() {
    return this.client
  }

  async ping() {
    await this.ensureConnected()
    return this.client.ping()
  }

  async get<T = string>(key: string): Promise<T | null> {
    await this.ensureConnected()
    const value = await this.client.get(key)
    return value ? JSON.parse(value) as T : null
  }

  async set(key: string, value: unknown, ttlSeconds?: number) {
    await this.ensureConnected()
    const payload = JSON.stringify(value)
    if (ttlSeconds) {
      await this.client.set(key, payload, 'EX', ttlSeconds)
      return
    }
    await this.client.set(key, payload)
  }

  async del(key: string) {
    await this.ensureConnected()
    return this.client.del(key)
  }

  async onModuleDestroy() {
    this.client.disconnect()
  }

  private async ensureConnected() {
    if (this.client.status === 'ready') return
    if (this.client.status === 'connecting' || this.client.status === 'connect') return
    await this.client.connect()
  }
}
