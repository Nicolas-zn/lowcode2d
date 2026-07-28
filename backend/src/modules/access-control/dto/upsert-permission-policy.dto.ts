import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { WorkspaceRole } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class UpsertPermissionPolicyDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string

  @ApiProperty({ enum: WorkspaceRole })
  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole

  @ApiProperty()
  @IsString()
  resource!: string

  @ApiProperty()
  @IsString()
  action!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effect?: string
}
