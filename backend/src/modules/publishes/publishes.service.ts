import { Injectable, NotFoundException } from '@nestjs/common'
import { NotificationType, Prisma, PublishStatus } from '@prisma/client'
import { AuditService } from '../audit/audit.service'
import { NotificationsService } from '../notifications/notifications.service'
import { ListPublishesDto } from './dto/list-publishes.dto'
import { PublishProjectDto } from './dto/publish-project.dto'
import { UpdatePublishStatusDto } from './dto/update-publish-status.dto'
import { PublishesRepository } from './publishes.repository'

@Injectable()
export class PublishesService {
  constructor(
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly publishesRepository: PublishesRepository
  ) {}

  list(userId: string, query: ListPublishesDto) {
    return this.publishesRepository.list(userId, query.projectId)
  }

  async getById(userId: string, publishId: string) {
    const publish = await this.publishesRepository.findAccessiblePublish(publishId, userId)
    if (!publish) throw new NotFoundException('Publish not found')
    return publish
  }

  async publishProject(userId: string, dto: PublishProjectDto) {
    const project = await this.publishesRepository.findAccessibleProject(dto.projectId, userId)
    if (!project) throw new NotFoundException('Project not found')

    const title = dto.title.trim()
    const slug = await this.createUniqueSlug(dto.slug || title)

    const publish = await this.publishesRepository.publish({
      projectId: project.id,
      workspaceId: project.workspaceId,
      ownerId: userId,
      schema: this.resolveSchema(project) as Prisma.InputJsonValue,
      slug,
      title,
      summary: dto.summary?.trim(),
      description: dto.description?.trim(),
      category: dto.category?.trim(),
      tags: dto.tags || [],
      coverUrl: dto.coverUrl || project.coverUrl || undefined
    })
    await this.auditService.log({
      workspaceId: project.workspaceId,
      actorId: userId,
      action: 'publish.create',
      targetType: 'Publish',
      targetId: publish.id,
      metadata: {
        projectId: project.id,
        marketplaceItemId: publish.marketplaceItem?.id,
        slug: publish.slug
      }
    })
    await this.notificationsService.create({
      userId,
      workspaceId: project.workspaceId,
      type: NotificationType.PUBLISH,
      title: '项目已发布',
      content: `「${title}」已发布到 Marketplace。`,
      metadata: {
        publishId: publish.id,
        marketplaceItemId: publish.marketplaceItem?.id,
        projectId: project.id
      }
    })
    return publish
  }

  async updateStatus(userId: string, publishId: string, dto: UpdatePublishStatusDto) {
    await this.getById(userId, publishId)
    const publish = await this.publishesRepository.updateStatus(publishId, dto.status)
    await this.auditService.log({
      workspaceId: publish.project.workspaceId,
      actorId: userId,
      action: 'publish.status.update',
      targetType: 'Publish',
      targetId: publish.id,
      metadata: { status: dto.status }
    })
    return publish
  }

  private async createUniqueSlug(value: string) {
    const base = this.toSlug(value)
    let slug = base
    let index = 1

    while (await this.publishesRepository.findSlug(slug)) {
      index += 1
      slug = `${base}-${index}`
    }

    return slug
  }

  private toSlug(value: string) {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return slug || `publish-${Date.now()}`
  }

  private resolveSchema(project: NonNullable<Awaited<ReturnType<PublishesRepository['findAccessibleProject']>>>) {
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
