import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class ListMarketplaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string
}
