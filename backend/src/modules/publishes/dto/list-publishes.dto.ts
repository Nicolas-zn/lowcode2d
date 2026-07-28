import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class ListPublishesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string
}
