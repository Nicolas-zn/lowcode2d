import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { AccessControlService } from '../../modules/access-control/access-control.service'
import { REQUIRE_PERMISSION_KEY, RequiredPermission } from '../decorators/require-permission.decorator'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessControlService: AccessControlService
  ) {}

  async canActivate(context: ExecutionContext) {
    const permission = this.reflector.getAllAndOverride<RequiredPermission>(REQUIRE_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!permission) return true

    const request = context.switchToHttp().getRequest<Request & { user?: { sub?: string } }>()
    const userId = request.user?.sub
    if (!userId) throw new ForbiddenException('Authentication required')

    const workspaceId = await this.resolveWorkspaceId(request)
    if (!workspaceId) {
      return true
    }

    const allowed = await this.accessControlService.can({
      userId,
      workspaceId,
      resource: permission.resource,
      action: permission.action
    })

    if (!allowed) throw new ForbiddenException('No permission for this operation')
    return true
  }

  private resolveWorkspaceId(request: Request) {
    const body = (request.body || {}) as Record<string, string | undefined>
    const query = (request.query || {}) as Record<string, string | undefined>
    const params = request.params || {}

    return this.accessControlService.resolveWorkspaceId({
      workspaceId: this.first(body.workspaceId) || this.first(query.workspaceId),
      projectId: this.first(body.projectId) || this.first(query.projectId) || this.first(params.projectId) || this.first(params.id),
      resourceId: this.first(body.resourceId) || this.first(query.resourceId) || this.first(params.resourceId) || this.first(params.id),
      datasourceId: this.first(body.datasourceId) || this.first(query.datasourceId) || this.first(params.datasourceId) || this.first(params.id),
      assetId: this.first(body.assetId) || this.first(query.assetId) || this.first(params.assetId) || this.first(params.id),
      publishId: this.first(body.publishId) || this.first(query.publishId) || this.first(params.publishId) || this.first(params.id),
      versionId: this.first(body.versionId) || this.first(query.versionId) || this.first(params.versionId) || this.first(params.id)
    })
  }

  private first(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value
  }
}
