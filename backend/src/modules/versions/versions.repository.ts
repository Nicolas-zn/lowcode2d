import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class VersionsRepository {
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

  list(projectId: string) {
    return this.prisma.version.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
      include: this.versionInclude()
    })
  }

  findAccessibleVersion(versionId: string, userId: string) {
    return this.prisma.version.findFirst({
      where: {
        id: versionId,
        project: {
          workspace: {
            members: {
              some: { userId }
            }
          }
        }
      },
      include: this.versionInclude()
    })
  }

  async createVersion(input: {
    projectId: string
    schema: Prisma.InputJsonValue
    metadata: Prisma.InputJsonValue
    title?: string
    description?: string
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
          metadata: input.metadata
        }
      })

      return tx.version.create({
        data: {
          projectId: input.projectId,
          snapshotId: snapshot.id,
          version: (latest?.version || 0) + 1,
          title: input.title,
          description: input.description
        },
        include: this.versionInclude()
      })
    })
  }

  async rollback(projectId: string, schema: Prisma.InputJsonValue) {
    return this.prisma.$transaction(async tx => {
      await tx.draft.upsert({
        where: { projectId },
        create: { projectId, schema },
        update: { schema }
      })

      await tx.editorSchema.create({
        data: { projectId, schema }
      })

      return tx.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date() }
      })
    })
  }

  private versionInclude() {
    return {
      snapshot: {
        select: {
          id: true,
          schema: true,
          createdAt: true,
          metadata: true
        }
      },
      project: {
        select: {
          id: true,
          name: true,
          workspaceId: true
        }
      }
    } satisfies Prisma.VersionInclude
  }
}
