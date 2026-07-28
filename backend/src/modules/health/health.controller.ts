import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  @Get()
  getHealth() {
    return {
      service: 'brickscreen-backend',
      status: 'ok',
      version: '2.0.0'
    }
  }

  @Get('database')
  async getDatabaseHealth() {
    await this.prisma.$queryRaw`select 1`
    return {
      database: 'ok'
    }
  }

  @Get('redis')
  async getRedisHealth() {
    const pong = await this.redis.ping()
    return {
      redis: pong === 'PONG' ? 'ok' : 'unknown',
      pong
    }
  }
}
