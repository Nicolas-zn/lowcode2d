import { ForbiddenException, Injectable } from '@nestjs/common'
import { newEnforcer, newModelFromString } from 'casbin'
import { Prisma, WorkspaceRole } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'publish' | 'fork' | 'manage'

const MODEL = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act, eft

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && keyMatch(r.obj, p.obj) && keyMatch(r.act, p.act)
`

const DEFAULT_POLICIES: Array<[WorkspaceRole, string, string, string]> = [
  [WorkspaceRole.OWNER, '*', '*', 'allow'],
  [WorkspaceRole.ADMIN, '*', '*', 'allow'],
  [WorkspaceRole.EDITOR, 'workspace', 'read', 'allow'],
  [WorkspaceRole.EDITOR, 'project', 'read', 'allow'],
  [WorkspaceRole.EDITOR, 'project', 'create', 'allow'],
  [WorkspaceRole.EDITOR, 'project', 'update', 'allow'],
  [WorkspaceRole.EDITOR, 'project', 'delete', 'allow'],
  [WorkspaceRole.EDITOR, 'editor', '*', 'allow'],
  [WorkspaceRole.EDITOR, 'resource', 'read', 'allow'],
  [WorkspaceRole.EDITOR, 'resource', 'create', 'allow'],
  [WorkspaceRole.EDITOR, 'resource', 'update', 'allow'],
  [WorkspaceRole.EDITOR, 'datasource', '*', 'allow'],
  [WorkspaceRole.EDITOR, 'asset', '*', 'allow'],
  [WorkspaceRole.EDITOR, 'publish', 'read', 'allow'],
  [WorkspaceRole.EDITOR, 'publish', 'publish', 'allow'],
  [WorkspaceRole.EDITOR, 'marketplace', 'fork', 'allow'],
  [WorkspaceRole.VIEWER, 'workspace', 'read', 'allow'],
  [WorkspaceRole.VIEWER, 'project', 'read', 'allow'],
  [WorkspaceRole.VIEWER, 'editor', 'read', 'allow'],
  [WorkspaceRole.VIEWER, 'resource', 'read', 'allow'],
  [WorkspaceRole.VIEWER, 'datasource', 'read', 'allow'],
  [WorkspaceRole.VIEWER, 'asset', 'read', 'allow'],
  [WorkspaceRole.VIEWER, 'publish', 'read', 'allow'],
  [WorkspaceRole.VIEWER, 'marketplace', 'fork', 'allow']
]

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  async can(input: { userId: string; workspaceId: string; resource: string; action: PermissionAction | string }) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: input.workspaceId,
          userId: input.userId
        }
      },
      select: { role: true }
    })

    if (!membership) return false

    const enforcer = await newEnforcer(newModelFromString(MODEL))
    for (const policy of DEFAULT_POLICIES) {
      await enforcer.addPolicy(...policy)
    }

    const policies = await this.prisma.permissionPolicy.findMany({
      where: { workspaceId: input.workspaceId }
    })
    for (const policy of policies) {
      await enforcer.addPolicy(policy.role, policy.resource, policy.action, policy.effect)
    }

    return enforcer.enforce(membership.role, input.resource, input.action)
  }

  async listPolicies(workspaceId: string, userId: string) {
    await this.assertCanManage(workspaceId, userId)
    return this.prisma.permissionPolicy.findMany({
      where: { workspaceId },
      orderBy: [{ role: 'asc' }, { resource: 'asc' }, { action: 'asc' }]
    })
  }

  async upsertPolicy(input: {
    workspaceId: string
    userId: string
    role: WorkspaceRole
    resource: string
    action: string
    effect?: string
  }) {
    await this.assertCanManage(input.workspaceId, input.userId)
    return this.prisma.permissionPolicy.upsert({
      where: {
        workspaceId_role_resource_action: {
          workspaceId: input.workspaceId,
          role: input.role,
          resource: input.resource,
          action: input.action
        }
      },
      create: {
        workspaceId: input.workspaceId,
        role: input.role,
        resource: input.resource,
        action: input.action,
        effect: input.effect || 'allow',
        createdById: input.userId
      },
      update: {
        effect: input.effect || 'allow',
        createdById: input.userId
      }
    })
  }

  async deletePolicy(policyId: string, userId: string) {
    const policy = await this.prisma.permissionPolicy.findUniqueOrThrow({
      where: { id: policyId }
    })
    await this.assertCanManage(policy.workspaceId, userId)
    return this.prisma.permissionPolicy.delete({
      where: { id: policyId }
    })
  }

  async resolveWorkspaceId(input: {
    workspaceId?: string
    projectId?: string
    resourceId?: string
    datasourceId?: string
    assetId?: string
    publishId?: string
    versionId?: string
  }) {
    if (input.workspaceId) return input.workspaceId
    if (input.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: input.projectId },
        select: { workspaceId: true }
      })
      if (project?.workspaceId) return project.workspaceId
    }
    if (input.resourceId) {
      const resource = await this.prisma.resource.findUnique({
        where: { id: input.resourceId },
        select: { workspaceId: true }
      })
      if (resource?.workspaceId) return resource.workspaceId
    }
    if (input.datasourceId) {
      const datasource = await this.prisma.datasource.findUnique({
        where: { id: input.datasourceId },
        select: { project: { select: { workspaceId: true } } }
      })
      if (datasource?.project.workspaceId) return datasource.project.workspaceId
    }
    if (input.assetId) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: input.assetId },
        select: { workspaceId: true }
      })
      if (asset?.workspaceId) return asset.workspaceId
    }
    if (input.publishId) {
      const publish = await this.prisma.publish.findUnique({
        where: { id: input.publishId },
        select: { project: { select: { workspaceId: true } } }
      })
      if (publish?.project.workspaceId) return publish.project.workspaceId
    }
    if (input.versionId) {
      const version = await this.prisma.version.findUnique({
        where: { id: input.versionId },
        select: { project: { select: { workspaceId: true } } }
      })
      if (version?.project.workspaceId) return version.project.workspaceId
    }
    return undefined
  }

  private async assertCanManage(workspaceId: string, userId: string) {
    const allowed = await this.can({
      userId,
      workspaceId,
      resource: 'permission',
      action: 'manage'
    })

    if (!allowed) {
      throw new ForbiddenException('No permission to manage workspace policy')
    }
  }
}
