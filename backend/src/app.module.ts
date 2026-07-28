import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AccessControlModule } from './modules/access-control/access-control.module'
import { AuditModule } from './modules/audit/audit.module'
import { HealthModule } from './modules/health/health.module'
import { TemplatesModule } from './modules/templates/templates.module'
import { AuthModule } from './modules/auth/auth.module'
import { ProjectsModule } from './modules/projects/projects.module'
import { EditorModule } from './modules/editor/editor.module'
import { AssetsModule } from './modules/assets/assets.module'
import { DatasourcesModule } from './modules/datasources/datasources.module'
import { MarketplaceModule } from './modules/marketplace/marketplace.module'
import { PublishesModule } from './modules/publishes/publishes.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { ResourcesModule } from './modules/resources/resources.module'
import { UsersModule } from './modules/users/users.module'
import { VersionsModule } from './modules/versions/versions.module'
import { WorkspacesModule } from './modules/workspaces/workspaces.module'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { validateEnv } from './config/env.validation'
import { RequestIdMiddleware } from './common/middleware/request-id.middleware'
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 300
      }
    ]),
    PrismaModule,
    RedisModule,
    AccessControlModule,
    AuditModule,
    NotificationsModule,
    UsersModule,
    WorkspacesModule,
    AuthModule,
    ProjectsModule,
    EditorModule,
    ResourcesModule,
    DatasourcesModule,
    AssetsModule,
    VersionsModule,
    PublishesModule,
    MarketplaceModule,
    TemplatesModule,
    HealthModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, RequestLoggerMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL })
  }
}
