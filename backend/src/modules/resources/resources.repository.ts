import { Injectable } from '@nestjs/common'
import { Prisma, ResourceType } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ResourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  isWorkspaceMember(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    })
  }

  list(userId: string, input: { workspaceId?: string; type?: ResourceType }) {
    const where: Prisma.ResourceWhereInput = {
      deletedAt: null,
      workspace: {
        members: {
          some: { userId }
        }
      }
    }

    if (input.workspaceId) where.workspaceId = input.workspaceId
    if (input.type) where.type = input.type

    return this.prisma.resource.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: this.resourceInclude()
    })
  }

  findAccessible(resourceId: string, userId: string) {
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
      include: this.resourceInclude()
    })
  }

  create(input: {
    workspaceId: string
    ownerId: string
    type: ResourceType
    name: string
    config: Prisma.InputJsonValue
  }) {
    return this.prisma.resource.create({
      data: input,
      include: this.resourceInclude()
    })
  }

  update(resourceId: string, data: Prisma.ResourceUpdateInput) {
    return this.prisma.resource.update({
      where: { id: resourceId },
      data,
      include: this.resourceInclude()
    })
  }

  softDelete(resourceId: string) {
    return this.prisma.resource.update({
      where: { id: resourceId },
      data: { deletedAt: new Date() },
      include: this.resourceInclude()
    })
  }

  private resourceInclude() {
    return {
      workspace: {
        select: { id: true, name: true, slug: true }
      },
      _count: {
        select: { datasources: true }
      }
    } satisfies Prisma.ResourceInclude
  }
}
