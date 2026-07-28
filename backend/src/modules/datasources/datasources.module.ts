import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { DatasourcesController } from './datasources.controller'
import { DatasourcesRepository } from './datasources.repository'
import { DatasourcesService } from './datasources.service'

@Module({
  imports: [PrismaModule],
  controllers: [DatasourcesController],
  providers: [DatasourcesService, DatasourcesRepository]
})
export class DatasourcesModule {}
