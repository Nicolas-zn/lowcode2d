import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { AuditModule } from '../audit/audit.module'
import { UsersModule } from '../users/users.module'
import { WorkspacesModule } from '../workspaces/workspaces.module'

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    AuditModule,
    UsersModule,
    WorkspacesModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
