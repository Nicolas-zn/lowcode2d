import { ApiPropertyOptional } from '@nestjs/swagger'
import { NotificationType } from '@prisma/client'
import { IsBooleanString, IsEnum, IsOptional } from 'class-validator'

export class ListNotificationsDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  unreadOnly?: string
}
