import { SetMetadata } from '@nestjs/common'
import { PermissionAction } from '../../modules/access-control/access-control.service'

export const REQUIRE_PERMISSION_KEY = 'require_permission'

export type RequiredPermission = {
  resource: string
  action: PermissionAction | string
}

export const RequirePermission = (resource: string, action: PermissionAction | string) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, { resource, action } satisfies RequiredPermission)
