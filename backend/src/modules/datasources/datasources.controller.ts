import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermission } from '../../common/decorators/require-permission.decorator'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { DatasourcesService } from './datasources.service'
import { CreateDatasourceDto } from './dto/create-datasource.dto'
import { ListDatasourcesDto } from './dto/list-datasources.dto'
import { UpdateDatasourceDto } from './dto/update-datasource.dto'

@ApiTags('Datasources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('datasources')
export class DatasourcesController {
  constructor(private readonly datasourcesService: DatasourcesService) {}

  @Get()
  @RequirePermission('datasource', 'read')
  list(@CurrentUser() user: { sub: string }, @Query() query: ListDatasourcesDto) {
    return this.datasourcesService.list(user.sub, query)
  }

  @Post()
  @RequirePermission('datasource', 'create')
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateDatasourceDto) {
    return this.datasourcesService.create(user.sub, dto)
  }

  @Get(':id')
  @RequirePermission('datasource', 'read')
  getById(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.datasourcesService.getById(user.sub, id)
  }

  @Patch(':id')
  @RequirePermission('datasource', 'update')
  update(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body() dto: UpdateDatasourceDto) {
    return this.datasourcesService.update(user.sub, id, dto)
  }

  @Delete(':id')
  @RequirePermission('datasource', 'delete')
  delete(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.datasourcesService.delete(user.sub, id)
  }

  @Post(':id/test')
  @RequirePermission('datasource', 'read')
  test(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.datasourcesService.test(user.sub, id)
  }
}
