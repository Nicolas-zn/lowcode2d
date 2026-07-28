import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsObject, IsOptional, IsString } from 'class-validator'

export class UploadAssetDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Comma separated tags for multipart requests.' })
  @IsOptional()
  @IsString()
  tags?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>
}
