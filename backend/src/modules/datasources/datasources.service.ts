import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { CreateDatasourceDto } from './dto/create-datasource.dto'
import { ListDatasourcesDto } from './dto/list-datasources.dto'
import { UpdateDatasourceDto } from './dto/update-datasource.dto'
import { DatasourcesRepository } from './datasources.repository'

@Injectable()
export class DatasourcesService {
  constructor(private readonly datasourcesRepository: DatasourcesRepository) {}

  async list(userId: string, query: ListDatasourcesDto) {
    if (query.projectId) {
      const project = await this.datasourcesRepository.findAccessibleProject(query.projectId, userId)
      if (!project) throw new NotFoundException('Project not found')
    }

    const datasources = await this.datasourcesRepository.list(userId, query.projectId)
    return datasources.map(datasource => this.present(datasource))
  }

  async getById(userId: string, datasourceId: string) {
    const datasource = await this.datasourcesRepository.findAccessible(datasourceId, userId)
    if (!datasource) throw new NotFoundException('Datasource not found')
    return this.present(datasource)
  }

  async create(userId: string, dto: CreateDatasourceDto) {
    const project = await this.datasourcesRepository.findAccessibleProject(dto.projectId, userId)
    if (!project) throw new NotFoundException('Project not found')
    await this.assertResourceCompatible(userId, project.workspaceId, dto.resourceId)

    const datasource = await this.datasourcesRepository.create({
      projectId: dto.projectId,
      resourceId: dto.resourceId,
      name: dto.name.trim(),
      config: (dto.config || {}) as Prisma.InputJsonValue
    })

    return this.present(datasource)
  }

  async update(userId: string, datasourceId: string, dto: UpdateDatasourceDto) {
    const current = await this.datasourcesRepository.findAccessible(datasourceId, userId)
    if (!current) throw new NotFoundException('Datasource not found')
    await this.assertResourceCompatible(userId, current.project.workspaceId, dto.resourceId)

    const datasource = await this.datasourcesRepository.update(datasourceId, {
      resource: dto.resourceId === undefined ? undefined : dto.resourceId ? { connect: { id: dto.resourceId } } : { disconnect: true },
      name: dto.name?.trim(),
      config: dto.config as Prisma.InputJsonValue | undefined
    })

    return this.present(datasource)
  }

  async delete(userId: string, datasourceId: string) {
    await this.getById(userId, datasourceId)
    const datasource = await this.datasourcesRepository.delete(datasourceId)
    return this.present(datasource)
  }

  async test(userId: string, datasourceId: string) {
    const datasource = await this.getById(userId, datasourceId)
    return {
      id: datasource.id,
      status: 'ok',
      checkedAt: new Date().toISOString(),
      message: '数据源配置已通过基础校验，查询执行器将在后续版本接入真实请求。',
      fields: this.extractFieldHints(datasource.configSummary)
    }
  }

  private async assertResourceCompatible(userId: string, workspaceId: string, resourceId?: string) {
    if (!resourceId) return

    const resource = await this.datasourcesRepository.findAccessibleResource(resourceId, userId)
    if (!resource) throw new NotFoundException('Resource not found')
    if (resource.workspaceId !== workspaceId) {
      throw new BadRequestException('Resource must belong to the same workspace as the project')
    }
  }

  private present(datasource: {
    id: string
    projectId: string
    resourceId: string | null
    name: string
    config: Prisma.JsonValue
    createdAt: Date
    updatedAt: Date
    project?: { id: string; name: string; workspaceId: string } | null
    resource?: { id: string; name: string; type: string; workspaceId: string } | null
  }) {
    return {
      ...datasource,
      configSummary: this.summarizeConfig(datasource.config)
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

  private extractFieldHints(configSummary: Record<string, unknown>) {
    return Object.keys(configSummary).map(key => ({
      path: key,
      type: typeof configSummary[key]
    }))
  }
}
