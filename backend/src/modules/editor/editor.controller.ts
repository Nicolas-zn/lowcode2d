import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermission } from '../../common/decorators/require-permission.decorator'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { SaveDraftDto } from './dto/save-draft.dto'
import { EditorService } from './editor.service'

@ApiTags('Editor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('editor/projects')
export class EditorController {
  constructor(private readonly editorService: EditorService) {}

  @Get(':projectId')
  @RequirePermission('editor', 'read')
  getEditor(@CurrentUser() user: { sub: string }, @Param('projectId') projectId: string) {
    return this.editorService.getProjectEditor(user.sub, projectId)
  }

  @Patch(':projectId/draft')
  @RequirePermission('editor', 'update')
  saveDraft(
    @CurrentUser() user: { sub: string },
    @Param('projectId') projectId: string,
    @Body() dto: SaveDraftDto
  ) {
    return this.editorService.saveDraft(user.sub, projectId, dto.schema, dto.draftVersion)
  }

  @Post(':projectId/snapshots')
  @RequirePermission('editor', 'update')
  createSnapshot(
    @CurrentUser() user: { sub: string },
    @Param('projectId') projectId: string,
    @Body() dto: SaveDraftDto
  ) {
    return this.editorService.createSnapshot(user.sub, projectId, dto.schema)
  }
}
