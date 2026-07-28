import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class ListVersionsDto {
  @ApiProperty()
  @IsString()
  projectId!: string
}
