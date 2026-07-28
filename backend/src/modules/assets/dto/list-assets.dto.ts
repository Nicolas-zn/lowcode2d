import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class ListAssetsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workspaceId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string
}
