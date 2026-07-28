import { AuditService } from './audit.service'

describe('AuditService', () => {
  it('writes audit logs with target and metadata', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'audit_1' })
    const service = new AuditService({
      auditLog: { create }
    } as any)

    await expect(service.log({
      workspaceId: 'workspace_1',
      actorId: 'user_1',
      action: 'project.create',
      targetType: 'Project',
      targetId: 'project_1',
      metadata: { name: 'Demo' }
    })).resolves.toEqual({ id: 'audit_1' })

    expect(create).toHaveBeenCalledWith({
      data: {
        workspaceId: 'workspace_1',
        actorId: 'user_1',
        action: 'project.create',
        targetType: 'Project',
        targetId: 'project_1',
        metadata: { name: 'Demo' }
      }
    })
  })
})
