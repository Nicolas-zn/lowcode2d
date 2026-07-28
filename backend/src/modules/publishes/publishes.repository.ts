import { Injectable } from '@nestjs/common'
import { MarketplaceItemStatus, Prisma, ProjectVisibility, PublishStatus } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PublishesRepository {
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
      include: {
        drafts: true,
        editorSchemas: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        },
        pages: {
          orderBy: { order: 'asc' }
        }
      }
    })
  }

  findSlug(slug: string) {
    return this.prisma.publish.findUnique({
      where: { slug },
      select: { id: true }
    })
  }

  list(userId: string, projectId?: string) {
    return this.prisma.publish.findMany({
      where: {
        projectId,
        project: {
          workspace: {
            members: {
              some: { userId }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      include: this.publishInclude()
    })
  }

  findAccessiblePublish(publishId: string, userId: string) {
    return this.prisma.publish.findFirst({
      where: {
        id: publishId,
        project: {
          workspace: {
            members: {
              some: { userId }
            }
          }
        }
      },
      include: this.publishInclude()
    })
  }

  async publish(input: {
    projectId: string
    workspaceId: string
    ownerId: string
    schema: Prisma.InputJsonValue
    slug: string
    title: string
    summary?: string
    description?: string
    category?: string
    tags: string[]
    coverUrl?: string
  }) {
    return this.prisma.$transaction(async tx => {
      const latest = await tx.version.findFirst({
        where: { projectId: input.projectId },
        orderBy: { version: 'desc' },
        select: { version: true }
      })

      const snapshot = await tx.snapshot.create({
        data: {
          projectId: input.projectId,
          schema: input.schema,
          metadata: {
            source: 'publish',
            createdBy: input.ownerId
          }
        }
      })

      const version = await tx.version.create({
        data: {
          projectId: input.projectId,
          snapshotId: snapshot.id,
          version: (latest?.version || 0) + 1,
          title: input.title,
          description: input.description
        }
      })

      const publish = await tx.publish.create({
        data: {
          projectId: input.projectId,
          snapshotId: snapshot.id,
          slug: input.slug,
          status: PublishStatus.PUBLISHED
        }
      })

      const item = await tx.marketplaceItem.create({
        data: {
          publishId: publish.id,
          projectId: input.projectId,
          snapshotId: snapshot.id,
          workspaceId: input.workspaceId,
          ownerId: input.ownerId,
          title: input.title,
          summary: input.summary,
          description: input.description,
          category: input.category,
          tags: input.tags,
          coverUrl: input.coverUrl,
          status: MarketplaceItemStatus.LISTED,
          listedAt: new Date()
        }
      })

      await tx.marketplaceTemplate.create({
        data: {
          itemId: item.id,
          projectId: input.projectId,
          snapshotId: snapshot.id,
          workspaceId: input.workspaceId,
          ownerId: input.ownerId,
          title: input.title,
          summary: input.summary,
          category: input.category,
          tags: input.tags,
          metadata: {
            version: version.version,
            publishId: publish.id
          }
        }
      })

      await tx.project.update({
        where: { id: input.projectId },
        data: {
          visibility: ProjectVisibility.PUBLIC,
          publishedAt: new Date(),
          updatedAt: new Date()
        }
      })

      return tx.publish.findUniqueOrThrow({
        where: { id: publish.id },
        include: this.publishInclude()
      })
    })
  }

  async updateStatus(publishId: string, status: PublishStatus) {
    const itemStatus = status === PublishStatus.PUBLISHED
      ? MarketplaceItemStatus.LISTED
      : MarketplaceItemStatus.UNLISTED

    return this.prisma.$transaction(async tx => {
      await tx.marketplaceItem.updateMany({
        where: { publishId },
        data: {
          status: itemStatus,
          listedAt: itemStatus === MarketplaceItemStatus.LISTED ? new Date() : undefined
        }
      })

      return tx.publish.update({
        where: { id: publishId },
        data: { status },
        include: this.publishInclude()
      })
    })
  }

  private publishInclude() {
    return {
      project: {
        select: {
          id: true,
          name: true,
          workspaceId: true,
          coverUrl: true,
          ownerId: true
        }
      },
      snapshot: {
        select: {
          id: true,
          createdAt: true,
          metadata: true
        }
      },
      marketplaceItem: true
    } satisfies Prisma.PublishInclude
  }
}
