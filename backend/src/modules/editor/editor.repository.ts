import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class EditorRepository {
  constructor(private readonly prisma: PrismaService) {}

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
      include: {
        pages: { orderBy: { order: 'asc' } },
        drafts: true,
        editorSchemas: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      }
    })
  }

  saveDraft(projectId: string, schema: Prisma.InputJsonValue) {
    return this.prisma.draft.upsert({
      where: { projectId },
      create: {
        projectId,
        schema
      },
      update: {
        schema
      }
    })
  }

  async createSnapshot(projectId: string, schema: Prisma.InputJsonValue, metadata?: Prisma.InputJsonValue) {
    return this.prisma.snapshot.create({
      data: {
        projectId,
        schema,
        metadata
      }
    })
  }

  touchProject(projectId: string) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() }
    })
  }
}
