import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { AuditModule } from '../audit/audit.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { PublishesController } from './publishes.controller'
import { PublishesRepository } from './publishes.repository'
import { PublishesService } from './publishes.service'

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule],
  controllers: [PublishesController],
  providers: [PublishesService, PublishesRepository]
})
export class PublishesModule {}
