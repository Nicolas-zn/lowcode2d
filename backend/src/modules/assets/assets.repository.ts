import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AssetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  isWorkspaceMember(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    })
  }

  list(userId: string, input: { workspaceId?: string; keyword?: string }) {
    const where: Prisma.AssetWhereInput = {
      deletedAt: null,
      NOT: {
        tags: { has: 'project-cover' }
      },
      file: {
        is: { bucket: { not: 'metadata' } }
      },
      workspace: {
        members: {
          some: { userId }
        }
      }
    }

    if (input.workspaceId) where.workspaceId = input.workspaceId
    if (input.keyword) {
      where.OR = [
        { name: { contains: input.keyword, mode: 'insensitive' } },
        { tags: { has: input.keyword } }
      ]
    }

    return this.prisma.asset.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: this.assetInclude()
    })
  }

  findAccessible(assetId: string, userId: string) {
    return this.prisma.asset.findFirst({
      where: {
        id: assetId,
        deletedAt: null,
        workspace: {
          members: {
            some: { userId }
          }
        }
      },
      include: this.assetInclude()
    })
  }

  async createWithFile(input: {
    workspaceId: string
    ownerId: string
    name: string
    tags: string[]
    metadata?: Prisma.InputJsonValue
    file: {
      url: string
      hash: string
      mime: string
      size: number
      width?: number
      height?: number
      bucket: string
      objectKey: string
    }
  }) {
    return this.prisma.$transaction(async tx => {
      const file = await tx.uploadFile.upsert({
        where: { hash: input.file.hash },
        create: {
          ownerId: input.ownerId,
          url: input.file.url,
          hash: input.file.hash,
          mime: input.file.mime,
          size: input.file.size,
          width: input.file.width,
          height: input.file.height,
          bucket: input.file.bucket,
          objectKey: input.file.objectKey
        },
        update: {
          url: input.file.url,
          mime: input.file.mime,
          size: input.file.size,
          width: input.file.width,
          height: input.file.height,
          bucket: input.file.bucket,
          objectKey: input.file.objectKey
        }
      })

      return tx.asset.create({
        data: {
          workspaceId: input.workspaceId,
          fileId: file.id,
          name: input.name,
          tags: input.tags,
          metadata: input.metadata
        },
        include: this.assetInclude()
      })
    })
  }

  update(assetId: string, data: Prisma.AssetUpdateInput) {
    return this.prisma.asset.update({
      where: { id: assetId },
      data,
      include: this.assetInclude()
    })
  }

  softDelete(assetId: string) {
    return this.prisma.asset.update({
      where: { id: assetId },
      data: { deletedAt: new Date() },
      include: this.assetInclude()
    })
  }

  private assetInclude() {
    return {
      workspace: {
        select: { id: true, name: true, slug: true }
      },
      file: true
    } satisfies Prisma.AssetInclude
  }
}
