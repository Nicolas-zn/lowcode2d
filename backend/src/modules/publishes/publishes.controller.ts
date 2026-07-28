import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermission } from '../../common/decorators/require-permission.decorator'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ListPublishesDto } from './dto/list-publishes.dto'
import { PublishProjectDto } from './dto/publish-project.dto'
import { UpdatePublishStatusDto } from './dto/update-publish-status.dto'
import { PublishesService } from './publishes.service'

@ApiTags('Publishes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('publishes')
export class PublishesController {
  constructor(private readonly publishesService: PublishesService) {}

  @Get()
  @RequirePermission('publish', 'read')
  list(@CurrentUser() user: { sub: string }, @Query() query: ListPublishesDto) {
    return this.publishesService.list(user.sub, query)
  }

  @Post()
  @RequirePermission('publish', 'publish')
  publishProject(@CurrentUser() user: { sub: string }, @Body() dto: PublishProjectDto) {
    return this.publishesService.publishProject(user.sub, dto)
  }

  @Get(':id')
  @RequirePermission('publish', 'read')
  getById(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.publishesService.getById(user.sub, id)
  }

  @Patch(':id/status')
  @RequirePermission('publish', 'publish')
  updateStatus(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdatePublishStatusDto
  ) {
    return this.publishesService.updateStatus(user.sub, id, dto)
  }
}
