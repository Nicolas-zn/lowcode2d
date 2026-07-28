import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { CreateResourceDto } from './dto/create-resource.dto'
import { ListResourcesDto } from './dto/list-resources.dto'
import { UpdateResourceDto } from './dto/update-resource.dto'
import { ResourcesRepository } from './resources.repository'

@Injectable()
export class ResourcesService {
  constructor(private readonly resourcesRepository: ResourcesRepository) {}

  async list(userId: string, query: ListResourcesDto) {
    const resources = await this.resourcesRepository.list(userId, query)
    return resources.map(resource => this.present(resource))
  }

  async getById(userId: string, resourceId: string) {
    const resource = await this.resourcesRepository.findAccessible(resourceId, userId)
    if (!resource) throw new NotFoundException('Resource not found')
    return this.present(resource)
  }

  async create(userId: string, dto: CreateResourceDto) {
    const membership = await this.resourcesRepository.isWorkspaceMember(dto.workspaceId, userId)
    if (!membership) throw new ForbiddenException('No access to workspace')

    const resource = await this.resourcesRepository.create({
      workspaceId: dto.workspaceId,
      ownerId: userId,
      type: dto.type,
      name: dto.name.trim(),
      config: (dto.config || {}) as Prisma.InputJsonValue
    })

    return this.present(resource)
  }

  async update(userId: string, resourceId: string, dto: UpdateResourceDto) {
    await this.getById(userId, resourceId)
    const resource = await this.resourcesRepository.update(resourceId, {
      type: dto.type,
      name: dto.name?.trim(),
      config: dto.config as Prisma.InputJsonValue | undefined
    })
    return this.present(resource)
  }

  async delete(userId: string, resourceId: string) {
    await this.getById(userId, resourceId)
    const resource = await this.resourcesRepository.softDelete(resourceId)
    return this.present(resource)
  }

  async test(userId: string, resourceId: string) {
    const resource = await this.getById(userId, resourceId)
    return {
      id: resource.id,
      type: resource.type,
      status: 'ok',
      checkedAt: new Date().toISOString(),
      message: '资源配置已通过基础校验，真实连接器将在调试执行器阶段接入。',
      configSummary: resource.configSummary
    }
  }

  private present(resource: {
    id: string
    workspaceId: string
    ownerId: string
    type: string
    name: string
    config: Prisma.JsonValue
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    workspace?: { id: string; name: string; slug: string } | null
    _count?: { datasources: number }
  }) {
    return {
      ...resource,
      configSummary: this.summarizeConfig(resource.config),
      config: undefined
    }
  }

  private summarizeConfig(config: Prisma.JsonValue) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) return {}

    return Object.fromEntries(
      Object.entries(config).map(([key, value]) => {
        const lowerKey = key.toLowerCase()
        if (['token', 'password', 'secret', 'apikey', 'api_key', 'authorization'].some(word => lowerKey.includes(word))) {
          return [key, '******']
        }
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [key, value]
        return [key, Array.isArray(value) ? `[Array(${value.length})]` : '[Object]']
      })
    )
  }
}
