import 'reflect-metadata'
import * as cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  const frontendOrigin = configService.get<string>('FRONTEND_ORIGIN') || 'http://localhost:5173'
  app.enableCors({
    origin: frontendOrigin.split(',').map(origin => origin.trim()),
    credentials: true
  })
  app.use(helmet())
  app.use(cookieParser())
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true
  }))
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  const swaggerConfig = new DocumentBuilder()
    .setTitle('BrickScreen Enterprise API')
    .setDescription('Enterprise SaaS API for the BrickScreen low-code platform.')
    .setVersion('2.0.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  const port = configService.get<number>('PORT') || 3000
  await app.listen(port)
}

void bootstrap()
