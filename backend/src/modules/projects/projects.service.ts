import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ProjectStatus } from '@prisma/client'
import { AuditService } from '../audit/audit.service'
import { StorageService } from '../assets/storage.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { DuplicateProjectDto } from './dto/duplicate-project.dto'
import { ListProjectsDto } from './dto/list-projects.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectsRepository } from './projects.repository'

@Injectable()
export class ProjectsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly projectsRepository: ProjectsRepository,
    private readonly storageService: StorageService
  ) {}

  list(userId: string, query: ListProjectsDto) {
    return this.projectsRepository.listProjects({
      userId,
      workspaceId: query.workspaceId,
      status: query.status,
      keyword: query.keyword?.trim() || undefined
    })
  }

  async getById(userId: string, projectId: string) {
    const project = await this.projectsRepository.findAccessibleProject(projectId, userId)
    if (!project) throw new NotFoundException('Project not found')

    await this.projectsRepository.recordRecentVisit(userId, projectId)
    return project
  }

  async create(userId: string, dto: CreateProjectDto) {
    const membership = await this.projectsRepository.isWorkspaceMember(dto.workspaceId, userId)
    if (!membership) throw new ForbiddenException('No access to workspace')

    const project = await this.projectsRepository.createProject({
      workspaceId: dto.workspaceId,
      ownerId: userId,
      name: dto.name.trim(),
      description: dto.description,
      icon: dto.icon,
      coverUrl: dto.coverUrl
    })
    await this.auditService.log({
      workspaceId: project.workspaceId,
      actorId: userId,
      action: 'project.create',
      targetType: 'Project',
      targetId: project.id,
      metadata: { name: project.name }
    })
    return project
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    await this.getById(userId, projectId)

    const project = await this.projectsRepository.updateProject(projectId, {
      name: dto.name?.trim(),
      description: dto.description,
      icon: dto.icon,
      coverUrl: dto.coverUrl
    })
    await this.auditService.log({
      workspaceId: project.workspaceId,
      actorId: userId,
      action: 'project.update',
      targetType: 'Project',
      targetId: project.id
    })
    return project
  }

  async updateCover(userId: string, projectId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Project cover image is required')

    const currentProject = await this.projectsRepository.findAccessibleProject(projectId, userId)
    if (!currentProject) throw new NotFoundException('Project not found')

    const uploaded = await this.storageService.upload({
      workspaceId: currentProject.workspaceId,
      originalName: file.originalname || `${projectId}-cover.jpg`,
      mime: file.mimetype,
      size: file.size,
      buffer: file.buffer
    })
    const project = await this.projectsRepository.updateProject(projectId, {
      coverUrl: uploaded.url
    })
    await this.auditService.log({
      workspaceId: project.workspaceId,
      actorId: userId,
      action: 'project.cover.update',
      targetType: 'Project',
      targetId: project.id
    })
    return project
  }

  async moveToTrash(userId: string, projectId: string) {
    await this.getById(userId, projectId)

    const project = await this.projectsRepository.updateProject(projectId, {
      status: ProjectStatus.TRASHED,
      deletedAt: new Date()
    })
    await this.auditService.log({
      workspaceId: project.workspaceId,
      actorId: userId,
      action: 'project.trash',
      targetType: 'Project',
      targetId: project.id
    })
    return project
  }

  async restore(userId: string, projectId: string) {
    await this.getById(userId, projectId)

    const project = await this.projectsRepository.updateProject(projectId, {
      status: ProjectStatus.ACTIVE,
      deletedAt: null
    })
    await this.auditService.log({
      workspaceId: project.workspaceId,
      actorId: userId,
      action: 'project.restore',
      targetType: 'Project',
      targetId: project.id
    })
    return project
  }

  async duplicate(userId: string, projectId: string, dto: DuplicateProjectDto) {
    await this.getById(userId, projectId)
    const project = await this.projectsRepository.duplicateProject(projectId, userId, dto.name?.trim())
    await this.auditService.log({
      workspaceId: project.workspaceId,
      actorId: userId,
      action: 'project.duplicate',
      targetType: 'Project',
      targetId: project.id,
      metadata: { sourceProjectId: projectId }
    })
    return project
  }
}
