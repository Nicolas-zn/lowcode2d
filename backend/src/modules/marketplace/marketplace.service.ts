import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { NotificationType } from '@prisma/client'
import { AuditService } from '../audit/audit.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateMarketplaceCommentDto } from './dto/create-marketplace-comment.dto'
import { ForkMarketplaceItemDto } from './dto/fork-marketplace-item.dto'
import { ListMarketplaceDto } from './dto/list-marketplace.dto'
import { MarketplaceRepository } from './marketplace.repository'

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly marketplaceRepository: MarketplaceRepository
  ) {}

  list(query: ListMarketplaceDto) {
    return this.marketplaceRepository.list({
      keyword: query.keyword?.trim() || undefined,
      category: query.category?.trim() || undefined
    })
  }

  async getById(itemId: string) {
    const item = await this.marketplaceRepository.getListedItem(itemId, true)
    if (!item) throw new NotFoundException('Marketplace item not found')
    return item
  }

  async comments(itemId: string) {
    const item = await this.marketplaceRepository.getListedItem(itemId)
    if (!item) throw new NotFoundException('Marketplace item not found')
    return this.marketplaceRepository.comments(itemId)
  }

  async addComment(userId: string, itemId: string, dto: CreateMarketplaceCommentDto) {
    const item = await this.marketplaceRepository.getListedItem(itemId)
    if (!item) throw new NotFoundException('Marketplace item not found')
    const comment = await this.marketplaceRepository.addComment(itemId, userId, dto.content.trim())
    await this.auditService.log({
      workspaceId: item.workspaceId,
      actorId: userId,
      action: 'marketplace.comment',
      targetType: 'MarketplaceItem',
      targetId: itemId,
      metadata: { commentId: comment.id }
    })
    return comment
  }

  async like(userId: string, itemId: string) {
    const item = await this.marketplaceRepository.getListedItem(itemId)
    if (!item) throw new NotFoundException('Marketplace item not found')
    const result = await this.marketplaceRepository.like(itemId, userId)
    await this.auditService.log({
      workspaceId: item.workspaceId,
      actorId: userId,
      action: 'marketplace.like',
      targetType: 'MarketplaceItem',
      targetId: itemId
    })
    return result
  }

  async unlike(userId: string, itemId: string) {
    const item = await this.marketplaceRepository.getListedItem(itemId)
    if (!item) throw new NotFoundException('Marketplace item not found')
    return this.marketplaceRepository.unlike(itemId, userId)
  }

  async fork(userId: string, itemId: string, dto: ForkMarketplaceItemDto) {
    const source = await this.marketplaceRepository.getForkSource(itemId)
    if (!source) throw new NotFoundException('Marketplace item not found')

    const membership = await this.marketplaceRepository.isWorkspaceMember(dto.workspaceId, userId)
    if (!membership) throw new ForbiddenException('No access to workspace')

    const project = await this.marketplaceRepository.fork({
      source,
      workspaceId: dto.workspaceId,
      ownerId: userId,
      name: dto.name?.trim() || `${source.title} Fork`
    })
    await this.auditService.log({
      workspaceId: dto.workspaceId,
      actorId: userId,
      action: 'marketplace.fork',
      targetType: 'Project',
      targetId: project.id,
      metadata: {
        marketplaceItemId: itemId,
        sourceProjectId: source.projectId
      }
    })
    await this.notificationsService.create({
      userId,
      workspaceId: dto.workspaceId,
      type: NotificationType.FORK,
      title: '模板 Fork 完成',
      content: `「${source.title}」已 Fork 到当前工作区。`,
      metadata: {
        marketplaceItemId: itemId,
        projectId: project.id
      }
    })
    if (source.ownerId !== userId) {
      await this.notificationsService.create({
        userId: source.ownerId,
        workspaceId: source.workspaceId,
        type: NotificationType.FORK,
        title: '你的模板被 Fork',
        content: `「${source.title}」刚刚被其他用户 Fork。`,
        metadata: {
          marketplaceItemId: itemId,
          forkedProjectId: project.id
        }
      })
    }
    return project
  }
}
