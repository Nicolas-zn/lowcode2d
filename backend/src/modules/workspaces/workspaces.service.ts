import { Injectable } from '@nestjs/common'
import { WorkspacesRepository } from './workspaces.repository'

@Injectable()
export class WorkspacesService {
  constructor(private readonly workspacesRepository: WorkspacesRepository) {}

  listForUser(userId: string) {
    return this.workspacesRepository.findUserWorkspaces(userId)
  }

  createDefaultForUser(input: { userId: string; email: string; displayName?: string }) {
    return this.workspacesRepository.createDefaultWorkspaceForUser(input)
  }
}
