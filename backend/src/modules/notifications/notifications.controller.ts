import { Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ListNotificationsDto } from './dto/list-notifications.dto'
import { NotificationsService } from './notifications.service'

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: { sub: string }, @Query() query: ListNotificationsDto) {
    return this.notificationsService.list(user.sub, query)
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.notificationsService.markRead(user.sub, id)
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: { sub: string }) {
    return this.notificationsService.markAllRead(user.sub)
  }
}
