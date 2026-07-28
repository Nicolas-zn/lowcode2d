import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { AssetsController, PublicAssetsController } from './assets.controller'
import { AssetsRepository } from './assets.repository'
import { AssetsService } from './assets.service'
import { StorageService } from './storage.service'

@Module({
  imports: [PrismaModule],
  controllers: [PublicAssetsController, AssetsController],
  providers: [AssetsService, AssetsRepository, StorageService],
  exports: [StorageService]
})
export class AssetsModule {}
