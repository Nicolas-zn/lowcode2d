import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AccessControlService } from './access-control.service'
import { UpsertPermissionPolicyDto } from './dto/upsert-permission-policy.dto'

@ApiTags('Access Control')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('access-control')
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get('policies')
  list(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string) {
    return this.accessControlService.listPolicies(workspaceId, user.sub)
  }

  @Post('policies')
  upsert(@CurrentUser() user: { sub: string }, @Body() dto: UpsertPermissionPolicyDto) {
    return this.accessControlService.upsertPolicy({
      ...dto,
      userId: user.sub
    })
  }

  @Delete('policies/:id')
  delete(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.accessControlService.deletePolicy(id, user.sub)
  }
}
