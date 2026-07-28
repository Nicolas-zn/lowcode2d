import { NotificationType } from '@prisma/client'
import { NotificationsService } from './notifications.service'

describe('NotificationsService', () => {
  it('creates typed notifications', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'notification_1' })
    const service = new NotificationsService({
      notification: { create }
    } as any)

    await expect(service.create({
      userId: 'user_1',
      workspaceId: 'workspace_1',
      type: NotificationType.PUBLISH,
      title: '发布完成',
      metadata: { publishId: 'publish_1' }
    })).resolves.toEqual({ id: 'notification_1' })

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user_1',
        workspaceId: 'workspace_1',
        type: NotificationType.PUBLISH,
        title: '发布完成',
        content: undefined,
        metadata: { publishId: 'publish_1' }
      }
    })
  })

  it('filters unread notifications', async () => {
    const findMany = jest.fn().mockResolvedValue([])
    const service = new NotificationsService({
      notification: { findMany }
    } as any)

    await service.list('user_1', { unreadOnly: 'true' })
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: 'user_1',
        readAt: null
      })
    }))
  })
})
