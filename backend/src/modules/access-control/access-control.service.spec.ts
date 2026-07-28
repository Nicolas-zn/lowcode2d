import { WorkspaceRole } from '@prisma/client'
import { AccessControlService } from './access-control.service'

describe('AccessControlService', () => {
  function createService(role: WorkspaceRole | null, policies: any[] = []) {
    const prisma = {
      workspaceMember: {
        findUnique: jest.fn().mockResolvedValue(role ? { role } : null)
      },
      permissionPolicy: {
        findMany: jest.fn().mockResolvedValue(policies)
      }
    }
    return new AccessControlService(prisma as any)
  }

  it('allows workspace owners to perform any action', async () => {
    const service = createService(WorkspaceRole.OWNER)
    await expect(service.can({
      userId: 'user_1',
      workspaceId: 'workspace_1',
      resource: 'project',
      action: 'delete'
    })).resolves.toBe(true)
  })

  it('denies viewers from mutating projects', async () => {
    const service = createService(WorkspaceRole.VIEWER)
    await expect(service.can({
      userId: 'user_1',
      workspaceId: 'workspace_1',
      resource: 'project',
      action: 'delete'
    })).resolves.toBe(false)
  })

  it('supports custom workspace policies', async () => {
    const service = createService(WorkspaceRole.VIEWER, [{
      role: WorkspaceRole.VIEWER,
      resource: 'asset',
      action: 'create',
      effect: 'allow'
    }])
    await expect(service.can({
      userId: 'user_1',
      workspaceId: 'workspace_1',
      resource: 'asset',
      action: 'create'
    })).resolves.toBe(true)
  })
})
