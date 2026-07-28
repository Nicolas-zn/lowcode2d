import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { CreateVersionDto } from './dto/create-version.dto'
import { ListVersionsDto } from './dto/list-versions.dto'
import { VersionsRepository } from './versions.repository'

@Injectable()
export class VersionsService {
  constructor(private readonly versionsRepository: VersionsRepository) {}

  async list(userId: string, query: ListVersionsDto) {
    const project = await this.versionsRepository.findAccessibleProject(query.projectId, userId)
    if (!project) throw new NotFoundException('Project not found')
    return this.versionsRepository.list(query.projectId)
  }

  async getById(userId: string, versionId: string) {
    const version = await this.versionsRepository.findAccessibleVersion(versionId, userId)
    if (!version) throw new NotFoundException('Version not found')
    return version
  }

  async create(userId: string, dto: CreateVersionDto) {
    const project = await this.versionsRepository.findAccessibleProject(dto.projectId, userId)
    if (!project) throw new NotFoundException('Project not found')

    return this.versionsRepository.createVersion({
      projectId: dto.projectId,
      schema: this.resolveSchema(project) as Prisma.InputJsonValue,
      metadata: {
        source: 'version',
        createdBy: userId
      },
      title: dto.title?.trim(),
      description: dto.description?.trim()
    })
  }

  async rollback(userId: string, versionId: string) {
    const version = await this.versionsRepository.findAccessibleVersion(versionId, userId)
    if (!version) throw new NotFoundException('Version not found')

    await this.versionsRepository.rollback(version.projectId, version.snapshot.schema as Prisma.InputJsonValue)
    return {
      id: version.id,
      projectId: version.projectId,
      version: version.version,
      rolledBackAt: new Date().toISOString()
    }
  }

  private resolveSchema(project: NonNullable<Awaited<ReturnType<VersionsRepository['findAccessibleProject']>>>) {
    return project.drafts[0]?.schema || project.editorSchemas[0]?.schema || {
      version: '2.0.0',
      projectId: project.id,
      pages: project.pages.map(page => ({
        id: page.id,
        name: page.name,
        components: []
      })),
      variables: {},
      events: [],
      styles: {},
      settings: {
        designResolution: '1080p',
        designWidth: 1920,
        designHeight: 1080
      }
    }
  }
}
