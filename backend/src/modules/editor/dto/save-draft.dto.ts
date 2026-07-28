import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsISO8601, IsObject, IsOptional, ValidateIf, ValidateNested } from 'class-validator'

export class DraftVersionDto {
  @ApiPropertyOptional({
    description: 'Client-side base draft updatedAt. Null means the client loaded an empty draft.',
    nullable: true
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsISO8601()
  updatedAt?: string | null
}

export class SaveDraftDto {
  @ApiProperty({ type: Object })
  @IsObject()
  schema!: Record<string, unknown>

  @ApiPropertyOptional({ type: DraftVersionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DraftVersionDto)
  draftVersion?: DraftVersionDto
}
