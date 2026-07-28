import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module'
import { AssetsModule } from '../assets/assets.module'
import { ProjectsController } from './projects.controller'
import { ProjectsRepository } from './projects.repository'
import { ProjectsService } from './projects.service'

@Module({
  imports: [AuditModule, AssetsModule],
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectsService],
  exports: [ProjectsService]
})
export class ProjectsModule {}
