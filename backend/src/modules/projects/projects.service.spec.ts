import { BadRequestException } from '@nestjs/common'
import { ProjectsService } from './projects.service'

describe('ProjectsService project cover', () => {
  function createService() {
    const auditService = { log: jest.fn().mockResolvedValue(undefined) }
    const projectsRepository = {
      findAccessibleProject: jest.fn(),
      updateProject: jest.fn()
    }
    const storageService = { upload: jest.fn() }
    return {
      auditService,
      projectsRepository,
      storageService,
      service: new ProjectsService(
        auditService as any,
        projectsRepository as any,
        storageService as any
      )
    }
  }

  it('uploads a cover and updates only the project record', async () => {
    const context = createService()
    const file = {
      originalname: 'cover.jpg',
      mimetype: 'image/jpeg',
      size: 5,
      buffer: Buffer.from('cover')
    } as Express.Multer.File
    context.projectsRepository.findAccessibleProject.mockResolvedValue({
      id: 'project_1',
      workspaceId: 'workspace_1'
    })
    context.storageService.upload.mockResolvedValue({
      url: '/api/assets/public/workspaces/workspace_1/cover.jpg'
    })
    context.projectsRepository.updateProject.mockResolvedValue({
      id: 'project_1',
      workspaceId: 'workspace_1',
      coverUrl: '/api/assets/public/workspaces/workspace_1/cover.jpg'
    })

    await context.service.updateCover('user_1', 'project_1', file)

    expect(context.storageService.upload).toHaveBeenCalledWith(expect.objectContaining({
      workspaceId: 'workspace_1',
      buffer: file.buffer
    }))
    expect(context.projectsRepository.updateProject).toHaveBeenCalledWith('project_1', {
      coverUrl: '/api/assets/public/workspaces/workspace_1/cover.jpg'
    })
  })

  it('rejects an empty cover upload', async () => {
    const { service, storageService } = createService()

    await expect(service.updateCover('user_1', 'project_1'))
      .rejects.toBeInstanceOf(BadRequestException)
    expect(storageService.upload).not.toHaveBeenCalled()
  })
})
