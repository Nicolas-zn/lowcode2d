import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MinLength } from 'class-validator'

export class CreateVersionDto {
  @ApiProperty()
  @IsString()
  projectId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string
}
