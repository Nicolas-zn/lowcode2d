import { plainToInstance } from 'class-transformer'
import { IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator'

class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string

  @IsString()
  CREDENTIAL_SECRET!: string

  @IsOptional()
  @IsString()
  NODE_ENV?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  PORT?: number

  @IsOptional()
  @IsString()
  REDIS_URL?: string

  @IsOptional()
  @IsString()
  FRONTEND_ORIGIN?: string

  @IsOptional()
  @IsString()
  ACCESS_TOKEN_TTL?: string

  @IsOptional()
  @IsString()
  REFRESH_TOKEN_TTL_DAYS?: string

  @IsOptional()
  @IsString()
  MINIO_ENDPOINT?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  MINIO_PORT?: number

  @IsOptional()
  @IsString()
  MINIO_USE_SSL?: string

  @IsOptional()
  @IsString()
  MINIO_ACCESS_KEY?: string

  @IsOptional()
  @IsString()
  MINIO_SECRET_KEY?: string

  @IsOptional()
  @IsString()
  MINIO_BUCKET?: string

  @IsOptional()
  @IsString()
  ASSET_PUBLIC_BASE_URL?: string
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true
  })
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }

  return validatedConfig
}
