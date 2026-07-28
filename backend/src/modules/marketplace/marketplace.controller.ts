import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermission } from '../../common/decorators/require-permission.decorator'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateMarketplaceCommentDto } from './dto/create-marketplace-comment.dto'
import { ForkMarketplaceItemDto } from './dto/fork-marketplace-item.dto'
import { ListMarketplaceDto } from './dto/list-marketplace.dto'
import { MarketplaceService } from './marketplace.service'

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  list(@Query() query: ListMarketplaceDto) {
    return this.marketplaceService.list(query)
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.marketplaceService.getById(id)
  }

  @Get(':id/comments')
  comments(@Param('id') id: string) {
    return this.marketplaceService.comments(id)
  }

  @Post(':id/comments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  addComment(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: CreateMarketplaceCommentDto
  ) {
    return this.marketplaceService.addComment(user.sub, id, dto)
  }

  @Post(':id/like')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  like(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.marketplaceService.like(user.sub, id)
  }

  @Delete(':id/like')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  unlike(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.marketplaceService.unlike(user.sub, id)
  }

  @Post(':id/fork')
  @ApiBearerAuth()
  @RequirePermission('marketplace', 'fork')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  fork(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: ForkMarketplaceItemDto
  ) {
    return this.marketplaceService.fork(user.sub, id, dto)
  }
}
