import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { DraftVersionDto } from './dto/save-draft.dto'
import { EditorRepository } from './editor.repository'

@Injectable()
export class EditorService {
  constructor(private readonly editorRepository: EditorRepository) {}

  async getProjectEditor(userId: string, projectId: string) {
    const project = await this.editorRepository.findAccessibleProject(projectId, userId)
    if (!project) throw new NotFoundException('Project not found')

    const draft = project.drafts[0]
    const schema = draft?.schema || project.editorSchemas[0]?.schema || this.createFallbackSchema(project)

    return {
      project: {
        id: project.id,
        name: project.name,
        workspaceId: project.workspaceId,
        updatedAt: project.updatedAt
      },
      schema,
      draftUpdatedAt: draft?.updatedAt || null
    }
  }

  async saveDraft(
    userId: string,
    projectId: string,
    schema: Record<string, unknown>,
    draftVersion?: DraftVersionDto
  ) {
    const project = await this.editorRepository.findAccessibleProject(projectId, userId)
    if (!project) throw new NotFoundException('Project not found')

    const currentDraftUpdatedAt = project.drafts[0]?.updatedAt?.toISOString() || null
    if (draftVersion && draftVersion.updatedAt !== currentDraftUpdatedAt) {
      throw new ConflictException('Draft has been updated by another session. Please reload before saving.')
    }

    const draft = await this.editorRepository.saveDraft(projectId, schema as Prisma.InputJsonValue)
    await this.editorRepository.touchProject(projectId)

    return {
      id: draft.id,
      projectId: draft.projectId,
      updatedAt: draft.updatedAt
    }
  }

  async createSnapshot(userId: string, projectId: string, schema: Record<string, unknown>) {
    const project = await this.editorRepository.findAccessibleProject(projectId, userId)
    if (!project) throw new NotFoundException('Project not found')

    const snapshot = await this.editorRepository.createSnapshot(projectId, schema as Prisma.InputJsonValue, {
      source: 'manual',
      createdBy: userId
    })

    return snapshot
  }

  private createFallbackSchema(project: { id: string; pages: Array<{ id: string; name: string }> }) {
    return {
      version: '2.0.0',
      projectId: project.id,
      pages: project.pages.map(page => ({
        id: page.id,
        name: page.name,
        components: []
      })),
      variables: {},
      events: [],
      styles: {},
      settings: {
        designResolution: '1080p',
        designWidth: 1920,
        designHeight: 1080
      }
    }
  }
}
