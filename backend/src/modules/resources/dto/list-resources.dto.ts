import { ApiPropertyOptional } from '@nestjs/swagger'
import { ResourceType } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class ListResourcesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workspaceId?: string

  @ApiPropertyOptional({ enum: ResourceType })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType
}
