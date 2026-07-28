import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator'

export class PublishProjectDto {
  @ApiProperty()
  @IsString()
  projectId!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string
}
