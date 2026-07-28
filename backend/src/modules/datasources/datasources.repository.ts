import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class DatasourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAccessibleProject(projectId: string, userId: string) {
    return this.prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
        workspace: {
          members: {
            some: { userId }
          }
        }
      },
      select: {
        id: true,
        workspaceId: true,
        name: true
      }
    })
  }

  findAccessibleResource(resourceId: string, userId: string) {
    return this.prisma.resource.findFirst({
      where: {
        id: resourceId,
        deletedAt: null,
        workspace: {
          members: {
            some: { userId }
          }
        }
      },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        type: true
      }
    })
  }

  list(userId: string, projectId?: string) {
    const where: Prisma.DatasourceWhereInput = {
      project: {
        workspace: {
          members: {
            some: { userId }
          }
        }
      }
    }

    if (projectId) where.projectId = projectId

    return this.prisma.datasource.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: this.datasourceInclude()
    })
  }

  findAccessible(datasourceId: string, userId: string) {
    return this.prisma.datasource.findFirst({
      where: {
        id: datasourceId,
        project: {
          workspace: {
            members: {
              some: { userId }
            }
          }
        }
      },
      include: this.datasourceInclude()
    })
  }

  create(input: {
    projectId: string
    resourceId?: string
    name: string
    config: Prisma.InputJsonValue
  }) {
    return this.prisma.datasource.create({
      data: input,
      include: this.datasourceInclude()
    })
  }

  update(datasourceId: string, data: Prisma.DatasourceUpdateInput) {
    return this.prisma.datasource.update({
      where: { id: datasourceId },
      data,
      include: this.datasourceInclude()
    })
  }

  delete(datasourceId: string) {
    return this.prisma.datasource.delete({
      where: { id: datasourceId },
      include: this.datasourceInclude()
    })
  }

  private datasourceInclude() {
    return {
      project: {
        select: { id: true, name: true, workspaceId: true }
      },
      resource: {
        select: { id: true, name: true, type: true, workspaceId: true }
      }
    } satisfies Prisma.DatasourceInclude
  }
}
