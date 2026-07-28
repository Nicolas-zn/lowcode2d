import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermission } from '../../common/decorators/require-permission.decorator'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateProjectDto } from './dto/create-project.dto'
import { DuplicateProjectDto } from './dto/duplicate-project.dto'
import { ListProjectsDto } from './dto/list-projects.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectsService } from './projects.service'

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @RequirePermission('project', 'read')
  list(@CurrentUser() user: { sub: string }, @Query() query: ListProjectsDto) {
    return this.projectsService.list(user.sub, query)
  }

  @Post()
  @RequirePermission('project', 'create')
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.sub, dto)
  }

  @Get(':id')
  @RequirePermission('project', 'read')
  getById(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.projectsService.getById(user.sub, id)
  }

  @Patch(':id')
  @RequirePermission('project', 'update')
  update(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(user.sub, id, dto)
  }

  @Post(':id/cover')
  @RequirePermission('project', 'update')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' }
      }
    }
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      callback(null, ['image/png', 'image/jpeg'].includes(file.mimetype))
    }
  }))
  updateCover(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.projectsService.updateCover(user.sub, id, file)
  }

  @Delete(':id')
  @RequirePermission('project', 'delete')
  moveToTrash(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.projectsService.moveToTrash(user.sub, id)
  }

  @Post(':id/restore')
  @RequirePermission('project', 'update')
  restore(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.projectsService.restore(user.sub, id)
  }

  @Post(':id/duplicate')
  @RequirePermission('project', 'create')
  duplicate(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body() dto: DuplicateProjectDto) {
    return this.projectsService.duplicate(user.sub, id, dto)
  }
}
