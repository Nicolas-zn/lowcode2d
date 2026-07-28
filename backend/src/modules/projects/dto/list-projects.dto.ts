import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'

export class ListProjectsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workspaceId?: string

  @ApiPropertyOptional({ enum: ['active', 'trashed', 'all'] })
  @IsOptional()
  @IsIn(['active', 'trashed', 'all'])
  status?: 'active' | 'trashed' | 'all'

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string
}
