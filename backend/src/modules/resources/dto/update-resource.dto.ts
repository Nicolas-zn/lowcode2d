import { ApiPropertyOptional } from '@nestjs/swagger'
import { ResourceType } from '@prisma/client'
import { IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateResourceDto {
  @ApiPropertyOptional({ enum: ResourceType })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType

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
