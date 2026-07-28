import { AssetsRepository } from './assets.repository'

describe('AssetsRepository', () => {
  it('lists only user-uploaded assets', async () => {
    const findMany = jest.fn().mockResolvedValue([])
    const repository = new AssetsRepository({
      asset: { findMany }
    } as any)

    await repository.list('user_1', { workspaceId: 'workspace_1' })

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        workspaceId: 'workspace_1',
        NOT: { tags: { has: 'project-cover' } },
        file: { is: { bucket: { not: 'metadata' } } }
      })
    }))
  })
})
