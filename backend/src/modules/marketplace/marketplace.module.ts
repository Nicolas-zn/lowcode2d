import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { AuditModule } from '../audit/audit.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { MarketplaceController } from './marketplace.controller'
import { MarketplaceRepository } from './marketplace.repository'
import { MarketplaceService } from './marketplace.service'

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, MarketplaceRepository]
})
export class MarketplaceModule {}
