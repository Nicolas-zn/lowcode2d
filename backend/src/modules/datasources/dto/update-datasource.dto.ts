import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateDatasourceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>
}
