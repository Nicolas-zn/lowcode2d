import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class ListAuditLogsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workspaceId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetType?: string
}
