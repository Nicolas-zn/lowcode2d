import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class ListDatasourcesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string
}
