import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsObject, IsString } from 'class-validator'

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hashValue!: string

  @ApiProperty({ type: Object })
  @IsObject()
  template!: Record<string, unknown>
}
