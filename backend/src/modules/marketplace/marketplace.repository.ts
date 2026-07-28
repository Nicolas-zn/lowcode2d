import { Injectable } from '@nestjs/common'
import { MarketplaceItemStatus, Prisma, ProjectStatus, ProjectVisibility } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

type MarketplaceForkSource = Prisma.MarketplaceItemGetPayload<{
  include: {
    snapshot: true
    project: {
      include: {
        datasources: {
          include: {
            resource: {
              select: {
                id: true
                workspaceId: true
              }
            }
          }
        }
      }
    }
  }
}>

@Injectable()
export class MarketplaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(input: { keyword?: string; category?: string }) {
    const where: Prisma.MarketplaceItemWhereInput = {
      status: MarketplaceItemStatus.LISTED
    }

    if (input.keyword) {
      where.OR = [
        { title: { contains: input.keyword, mode: 'insensitive' } },
        { summary: { contains: input.keyword, mode: 'insensitive' } },
        { description: { contains: input.keyword, mode: 'insensitive' } },
        { tags: { has: input.keyword } }
      ]
    }

    if (input.category) where.category = input.category

    return this.prisma.marketplaceItem.findMany({
      where,
      orderBy: [
        { listedAt: 'desc' },
        { updatedAt: 'desc' }
      ],
      include: this.itemInclude()
    })
  }

  async getListedItem(itemId: string, incrementView = false) {
    if (incrementView) {
      await this.prisma.marketplaceItem.updateMany({
        where: { id: itemId, status: MarketplaceItemStatus.LISTED },
        data: { viewCount: { increment: 1 } }
      })
    }

    return this.prisma.marketplaceItem.findFirst({
      where: {
        id: itemId,
        status: MarketplaceItemStatus.LISTED
      },
      include: this.itemInclude()
    })
  }

  getForkSource(itemId: string) {
    return this.prisma.marketplaceItem.findFirst({
      where: {
        id: itemId,
        status: MarketplaceItemStatus.LISTED
      },
      include: {
        snapshot: true,
        project: {
          include: {
            datasources: {
              include: {
                resource: {
                  select: {
                    id: true,
                    workspaceId: true
                  }
                }
              }
            }
          }
        }
      }
    })
  }

  isWorkspaceMember(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    })
  }

  comments(itemId: string) {
    return this.prisma.marketplaceComment.findMany({
      where: {
        itemId,
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })
  }

  async addComment(itemId: string, userId: string, content: string) {
    return this.prisma.$transaction(async tx => {
      const comment = await tx.marketplaceComment.create({
        data: { itemId, userId, content },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      })

      await tx.marketplaceItem.update({
        where: { id: itemId },
        data: { commentCount: { increment: 1 } }
      })

      return comment
    })
  }

  async like(itemId: string, userId: string) {
    return this.prisma.$transaction(async tx => {
      const existing = await tx.marketplaceLike.findUnique({
        where: { itemId_userId: { itemId, userId } }
      })

      if (existing) {
        return {
          liked: true,
          item: await tx.marketplaceItem.findUniqueOrThrow({
            where: { id: itemId },
            include: this.itemInclude()
          })
        }
      }

      await tx.marketplaceLike.create({
        data: { itemId, userId }
      })
      const item = await tx.marketplaceItem.update({
        where: { id: itemId },
        data: { likeCount: { increment: 1 } },
        include: this.itemInclude()
      })

      return { liked: true, item }
    })
  }

  async unlike(itemId: string, userId: string) {
    return this.prisma.$transaction(async tx => {
      const existing = await tx.marketplaceLike.findUnique({
        where: { itemId_userId: { itemId, userId } }
      })

      if (existing) {
        await tx.marketplaceLike.delete({
          where: { itemId_userId: { itemId, userId } }
        })
        await tx.marketplaceItem.update({
          where: { id: itemId },
          data: { likeCount: { decrement: 1 } }
        })
      }

      const item = await tx.marketplaceItem.findUniqueOrThrow({
        where: { id: itemId },
        include: this.itemInclude()
      })

      return { liked: false, item }
    })
  }

  async fork(input: {
    source: MarketplaceForkSource
    workspaceId: string
    ownerId: string
    name: string
  }) {
    return this.prisma.$transaction(async tx => {
      const project = await tx.project.create({
        data: {
          workspaceId: input.workspaceId,
          ownerId: input.ownerId,
          name: input.name,
          description: input.source.summary,
          coverUrl: input.source.coverUrl,
          visibility: ProjectVisibility.PRIVATE,
          status: ProjectStatus.ACTIVE,
          forkedFromId: input.source.projectId
        }
      })

      const schema = this.cloneSchemaForProject(input.source.snapshot.schema, project.id, project.name)
      const pages = Array.isArray(schema.pages) && schema.pages.length > 0
        ? schema.pages
        : [{ name: '页面 1', components: [] }]

      for (let index = 0; index < pages.length; index += 1) {
        const page = pages[index] as Record<string, unknown>
        const created = await tx.page.create({
          data: {
            projectId: project.id,
            name: String(page.name || `页面 ${index + 1}`),
            order: index
          }
        })
        page.id = created.id
        page.projectId = project.id
        page.projectName = project.name
      }

      await tx.editorSchema.create({
        data: {
          projectId: project.id,
          schema: schema as Prisma.InputJsonValue
        }
      })

      await tx.draft.create({
        data: {
          projectId: project.id,
          schema: schema as Prisma.InputJsonValue
        }
      })

      for (const datasource of input.source.project.datasources) {
        await tx.datasource.create({
          data: {
            projectId: project.id,
            resourceId: datasource.resource?.workspaceId === input.workspaceId ? datasource.resourceId : null,
            name: datasource.name,
            config: datasource.config as Prisma.InputJsonValue
          }
        })
      }

      await tx.marketplaceItem.update({
        where: { id: input.source.id },
        data: { forkCount: { increment: 1 } }
      })

      return tx.project.findUniqueOrThrow({
        where: { id: project.id },
        include: {
          workspace: {
            select: { id: true, name: true, slug: true }
          },
          _count: {
            select: { pages: true, datasources: true, versions: true }
          }
        }
      })
    })
  }

  private cloneSchemaForProject(schema: Prisma.JsonValue, projectId: string, projectName: string) {
    const cloned = JSON.parse(JSON.stringify(schema || {}))
    cloned.projectId = projectId
    cloned.project = {
      ...(cloned.project || {}),
      id: projectId,
      name: projectName
    }

    if (Array.isArray(cloned.pages)) {
      cloned.pages = cloned.pages.map((page: Record<string, unknown>, index: number) => ({
        ...page,
        id: page.id || `${projectId}_page_${index + 1}`,
        projectId,
        projectName
      }))
    }

    return cloned
  }

  private itemInclude() {
    return {
      project: {
        select: {
          id: true,
          name: true,
          workspaceId: true,
          coverUrl: true,
          createdAt: true
        }
      },
      owner: {
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true
        }
      },
      publish: {
        select: {
          id: true,
          slug: true,
          status: true,
          createdAt: true
        }
      },
      snapshot: {
        select: {
          id: true,
          createdAt: true
        }
      },
      template: {
        select: {
          id: true,
          title: true,
          category: true
        }
      }
    } satisfies Prisma.MarketplaceItemInclude
  }
}
