import { Global, Module } from '@nestjs/common'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { PrismaModule } from '../../prisma/prisma.module'
import { AccessControlController } from './access-control.controller'
import { AccessControlService } from './access-control.service'

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AccessControlController],
  providers: [AccessControlService, PermissionGuard],
  exports: [AccessControlService, PermissionGuard]
})
export class AccessControlModule {}
