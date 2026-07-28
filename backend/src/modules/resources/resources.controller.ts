import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermission } from '../../common/decorators/require-permission.decorator'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateResourceDto } from './dto/create-resource.dto'
import { ListResourcesDto } from './dto/list-resources.dto'
import { UpdateResourceDto } from './dto/update-resource.dto'
import { ResourcesService } from './resources.service'

@ApiTags('Resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @RequirePermission('resource', 'read')
  list(@CurrentUser() user: { sub: string }, @Query() query: ListResourcesDto) {
    return this.resourcesService.list(user.sub, query)
  }

  @Post()
  @RequirePermission('resource', 'create')
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateResourceDto) {
    return this.resourcesService.create(user.sub, dto)
  }

  @Get(':id')
  @RequirePermission('resource', 'read')
  getById(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.resourcesService.getById(user.sub, id)
  }

  @Patch(':id')
  @RequirePermission('resource', 'update')
  update(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body() dto: UpdateResourceDto) {
    return this.resourcesService.update(user.sub, id, dto)
  }

  @Delete(':id')
  @RequirePermission('resource', 'delete')
  delete(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.resourcesService.delete(user.sub, id)
  }

  @Post(':id/test')
  @RequirePermission('resource', 'read')
  test(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.resourcesService.test(user.sub, id)
  }
}
