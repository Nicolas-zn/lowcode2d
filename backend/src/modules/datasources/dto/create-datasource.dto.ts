import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateDatasourceDto {
  @ApiProperty()
  @IsString()
  projectId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceId?: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>
}
