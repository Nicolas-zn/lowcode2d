import { Injectable } from '@nestjs/common'
import { Prisma, ProjectStatus } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

type ProjectDuplicateSource = Prisma.ProjectGetPayload<{
  include: {
    pages: true
    editorSchemas: true
    drafts: true
  }
}>

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  isWorkspaceMember(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    })
  }

  findAccessibleProject(projectId: string, userId: string) {
    return this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          members: {
            some: { userId }
          }
        }
      },
      include: this.projectInclude()
    })
  }

  listProjects(input: {
    userId: string
    workspaceId?: string
    status?: 'active' | 'trashed' | 'all'
    keyword?: string
  }) {
    const where: Prisma.ProjectWhereInput = {
      workspace: {
        members: {
          some: { userId: input.userId }
        }
      }
    }

    if (input.workspaceId) {
      where.workspaceId = input.workspaceId
    }

    if (input.status === 'trashed') {
      where.status = ProjectStatus.TRASHED
    } else if (input.status !== 'all') {
      where.status = ProjectStatus.ACTIVE
      where.deletedAt = null
    }

    if (input.keyword) {
      where.OR = [
        { name: { contains: input.keyword, mode: 'insensitive' } },
        { description: { contains: input.keyword, mode: 'insensitive' } }
      ]
    }

    return this.prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: this.projectInclude()
    })
  }

  async createProject(input: {
    workspaceId: string
    ownerId: string
    name: string
    description?: string
    icon?: string
    coverUrl?: string
  }) {
    return this.prisma.$transaction(async tx => {
      const project = await tx.project.create({
        data: {
          workspaceId: input.workspaceId,
          ownerId: input.ownerId,
          name: input.name,
          description: input.description,
          icon: input.icon,
          coverUrl: input.coverUrl
        }
      })
      const page = await tx.page.create({
        data: {
          projectId: project.id,
          name: '页面 1',
          order: 0
        }
      })
      const schema = this.createInitialSchema(project.id, page.id, page.name)
      await tx.editorSchema.create({
        data: {
          projectId: project.id,
          pageId: page.id,
          schema
        }
      })
      await tx.draft.create({
        data: {
          projectId: project.id,
          schema
        }
      })

      return tx.project.findUniqueOrThrow({
        where: { id: project.id },
        include: this.projectInclude()
      })
    })
  }

  updateProject(projectId: string, data: Prisma.ProjectUpdateInput) {
    return this.prisma.project.update({
      where: { id: projectId },
      data,
      include: this.projectInclude()
    })
  }

  async duplicateProject(projectId: string, userId: string, name?: string) {
    const source: ProjectDuplicateSource = await this.prisma.project.findFirstOrThrow({
      where: {
        id: projectId,
        workspace: { members: { some: { userId } } }
      },
      include: {
        pages: true,
        editorSchemas: true,
        drafts: true
      }
    })

    return this.prisma.$transaction(async tx => {
      const duplicate = await tx.project.create({
        data: {
          workspaceId: source.workspaceId,
          ownerId: userId,
          folderId: source.folderId,
          name: name || `${source.name} 副本`,
          description: source.description,
          icon: source.icon,
          coverUrl: source.coverUrl,
          forkedFromId: source.id
        }
      })

      const pageIdMap = new Map<string, string>()
      for (const page of source.pages) {
        const newPage = await tx.page.create({
          data: {
            projectId: duplicate.id,
            name: page.name,
            order: page.order
          }
        })
        pageIdMap.set(page.id, newPage.id)
      }

      for (const editorSchema of source.editorSchemas) {
        await tx.editorSchema.create({
          data: {
            projectId: duplicate.id,
            pageId: editorSchema.pageId ? pageIdMap.get(editorSchema.pageId) : null,
            schema: editorSchema.schema as Prisma.InputJsonValue
          }
        })
      }

      const draft = source.drafts[0]
      if (draft) {
        await tx.draft.create({
          data: {
            projectId: duplicate.id,
            schema: draft.schema as Prisma.InputJsonValue
          }
        })
      }

      return tx.project.findUniqueOrThrow({
        where: { id: duplicate.id },
        include: this.projectInclude()
      })
    })
  }

  recordRecentVisit(userId: string, projectId: string) {
    return this.prisma.recentVisit.upsert({
      where: {
        userId_projectId: { userId, projectId }
      },
      create: {
        userId,
        projectId
      },
      update: {
        visitedAt: new Date()
      }
    })
  }

  private projectInclude() {
    return {
      folder: {
        select: { id: true, name: true }
      },
      workspace: {
        select: { id: true, name: true, slug: true }
      },
      _count: {
        select: { pages: true, datasources: true, versions: true }
      }
    } satisfies Prisma.ProjectInclude
  }

  private createInitialSchema(projectId: string, pageId: string, pageName: string): Prisma.InputJsonValue {
    return {
      version: '2.0.0',
      projectId,
      pages: [
        {
          id: pageId,
          name: pageName,
          components: []
        }
      ],
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
