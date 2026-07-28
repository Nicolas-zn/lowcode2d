import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermission } from '../../common/decorators/require-permission.decorator'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateVersionDto } from './dto/create-version.dto'
import { ListVersionsDto } from './dto/list-versions.dto'
import { VersionsService } from './versions.service'

@ApiTags('Versions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get()
  @RequirePermission('publish', 'read')
  list(@CurrentUser() user: { sub: string }, @Query() query: ListVersionsDto) {
    return this.versionsService.list(user.sub, query)
  }

  @Post()
  @RequirePermission('publish', 'publish')
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateVersionDto) {
    return this.versionsService.create(user.sub, dto)
  }

  @Get(':id')
  @RequirePermission('publish', 'read')
  getById(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.versionsService.getById(user.sub, id)
  }

  @Post(':id/rollback')
  @RequirePermission('publish', 'publish')
  rollback(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.versionsService.rollback(user.sub, id)
  }
}
