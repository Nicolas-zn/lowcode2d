import { Injectable } from '@nestjs/common'
import { Prisma, WorkspaceRole } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserWorkspaces(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        deletedAt: null,
        members: {
          some: { userId }
        }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        members: {
          where: { userId },
          select: { role: true }
        },
        _count: {
          select: {
            projects: true,
            resources: true,
            assets: {
              where: {
                deletedAt: null,
                NOT: { tags: { has: 'project-cover' } },
                file: { is: { bucket: { not: 'metadata' } } }
              }
            }
          }
        }
      }
    })
  }

  async createDefaultWorkspaceForUser(input: { userId: string; email: string; displayName?: string }) {
    const workspaceName = `${input.displayName || input.email.split('@')[0]} 的工作区`
    const slugBase = this.toSlug(input.email.split('@')[0] || 'workspace')
    const slug = await this.createUniqueSlug(slugBase)

    return this.prisma.workspace.create({
      data: {
        name: workspaceName,
        slug,
        ownerId: input.userId,
        members: {
          create: {
            userId: input.userId,
            role: WorkspaceRole.OWNER
          }
        }
      },
      include: {
        members: {
          where: { userId: input.userId },
          select: { role: true }
        },
        _count: {
          select: {
            projects: true,
            resources: true,
            assets: {
              where: {
                deletedAt: null,
                NOT: { tags: { has: 'project-cover' } },
                file: { is: { bucket: { not: 'metadata' } } }
              }
            }
          }
        }
      }
    })
  }

  private async createUniqueSlug(base: string) {
    let slug = base
    let index = 1

    while (await this.prisma.workspace.findUnique({ where: { slug } })) {
      index += 1
      slug = `${base}-${index}`
    }

    return slug
  }

  private toSlug(value: string) {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    return slug || `workspace-${Date.now()}`
  }
}
