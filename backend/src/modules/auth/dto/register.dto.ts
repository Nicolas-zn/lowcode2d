import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ minLength: 8, example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password!: string

  @ApiPropertyOptional({ example: 'Admin' })
  @IsOptional()
  @IsString()
  displayName?: string
}
