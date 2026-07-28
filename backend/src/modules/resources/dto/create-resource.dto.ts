import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ResourceType } from '@prisma/client'
import { IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateResourceDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string

  @ApiProperty({ enum: ResourceType })
  @IsEnum(ResourceType)
  type!: ResourceType

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>
}
