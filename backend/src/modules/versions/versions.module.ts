import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { VersionsController } from './versions.controller'
import { VersionsRepository } from './versions.repository'
import { VersionsService } from './versions.service'

@Module({
  imports: [PrismaModule],
  controllers: [VersionsController],
  providers: [VersionsService, VersionsRepository],
  exports: [VersionsService]
})
export class VersionsModule {}
