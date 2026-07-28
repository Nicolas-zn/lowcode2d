import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MinLength } from 'class-validator'

export class ForkMarketplaceItemDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string
}
