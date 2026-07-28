import { createHash } from 'node:crypto'
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { AssetsRepository } from './assets.repository'
import { ListAssetsDto } from './dto/list-assets.dto'
import { UpdateAssetDto } from './dto/update-asset.dto'
import { UploadAssetDto } from './dto/upload-asset.dto'
import { StorageService } from './storage.service'

@Injectable()
export class AssetsService {
  constructor(
    private readonly assetsRepository: AssetsRepository,
    private readonly storageService: StorageService
  ) {}

  list(userId: string, query: ListAssetsDto) {
    return this.assetsRepository.list(userId, {
      workspaceId: query.workspaceId,
      keyword: query.keyword?.trim() || undefined
    })
  }

  async getById(userId: string, assetId: string) {
    const asset = await this.assetsRepository.findAccessible(assetId, userId)
    if (!asset) throw new NotFoundException('Asset not found')
    return asset
  }

  async upload(userId: string, dto: UploadAssetDto, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required')

    const membership = await this.assetsRepository.isWorkspaceMember(dto.workspaceId, userId)
    if (!membership) throw new ForbiddenException('No access to workspace')

    const uploaded = await this.storageService.upload({
      workspaceId: dto.workspaceId,
      originalName: file.originalname,
      mime: file.mimetype,
      size: file.size,
      buffer: file.buffer
    })

    return this.assetsRepository.createWithFile({
      workspaceId: dto.workspaceId,
      ownerId: userId,
      name: (dto.name || file.originalname || '未命名资产').trim(),
      tags: this.parseTags(dto.tags),
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      file: {
        url: uploaded.url,
        hash: this.createBufferHash(file.buffer),
        mime: file.mimetype,
        size: file.size,
        bucket: uploaded.bucket,
        objectKey: uploaded.objectKey
      }
    })
  }

  async update(userId: string, assetId: string, dto: UpdateAssetDto) {
    await this.getById(userId, assetId)
    return this.assetsRepository.update(assetId, {
      name: dto.name?.trim(),
      tags: dto.tags,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined
    })
  }

  async delete(userId: string, assetId: string) {
    await this.getById(userId, assetId)
    return this.assetsRepository.softDelete(assetId)
  }

  private createBufferHash(buffer: Buffer) {
    return createHash('sha256').update(buffer).digest('hex')
  }

  private parseTags(tags?: string) {
    if (!tags) return []
    return tags.split(',').map(tag => tag.trim()).filter(Boolean)
  }
}
