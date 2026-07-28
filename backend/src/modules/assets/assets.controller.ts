import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermission } from '../../common/decorators/require-permission.decorator'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AssetsService } from './assets.service'
import { ListAssetsDto } from './dto/list-assets.dto'
import { UpdateAssetDto } from './dto/update-asset.dto'
import { UploadAssetDto } from './dto/upload-asset.dto'
import { StorageService } from './storage.service'

@ApiTags('Assets')
@Controller('assets/public')
export class PublicAssetsController {
  constructor(private readonly storageService: StorageService) {}

  @Get('{*objectKey}')
  async getFile(
    @Param('objectKey') objectKeyParam: string | string[],
    @Res({ passthrough: true }) response: Response
  ) {
    const objectKey = Array.isArray(objectKeyParam) ? objectKeyParam.join('/') : objectKeyParam
    if (!objectKey) throw new NotFoundException('Asset file not found')

    const file = await this.storageService.getObject(objectKey)
    if (file.mime) response.setHeader('Content-Type', file.mime)
    if (file.size) response.setHeader('Content-Length', String(file.size))
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    return new StreamableFile(file.stream)
  }
}

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @RequirePermission('asset', 'read')
  list(@CurrentUser() user: { sub: string }, @Query() query: ListAssetsDto) {
    return this.assetsService.list(user.sub, query)
  }

  @Post('upload')
  @RequirePermission('asset', 'create')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['workspaceId', 'file'],
      properties: {
        workspaceId: { type: 'string' },
        name: { type: 'string' },
        tags: { type: 'string' },
        file: { type: 'string', format: 'binary' }
      }
    }
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024
    },
    fileFilter: (_req, file, callback) => {
      const allowed = [
        'image/png',
        'image/jpeg',
        'image/svg+xml',
        'application/json',
        'video/mp4',
        'audio/mpeg',
        'font/woff',
        'font/woff2',
        'text/plain'
      ]
      callback(null, allowed.includes(file.mimetype))
    }
  }))
  upload(
    @CurrentUser() user: { sub: string },
    @Body() dto: UploadAssetDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.assetsService.upload(user.sub, dto, file)
  }

  @Get(':id')
  @RequirePermission('asset', 'read')
  getById(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.assetsService.getById(user.sub, id)
  }

  @Patch(':id')
  @RequirePermission('asset', 'update')
  update(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(user.sub, id, dto)
  }

  @Delete(':id')
  @RequirePermission('asset', 'delete')
  delete(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.assetsService.delete(user.sub, id)
  }
}
