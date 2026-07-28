import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MinLength } from 'class-validator'

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string

  @ApiProperty({ example: '智慧园区运营大屏' })
  @IsString()
  @MinLength(1)
  name!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string
}
