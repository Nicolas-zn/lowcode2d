import { request } from './request'

export async function getEditorProjectApi(projectId) {
  return request.get(`/editor/projects/${projectId}`)
}

export async function saveEditorDraftApi(projectId, schema, draftVersion) {
  const payload = { schema }
  if (draftVersion !== undefined) {
    payload.draftVersion = draftVersion
  }
  return request.patch(`/editor/projects/${projectId}/draft`, payload)
}

export async function createEditorSnapshotApi(projectId, schema) {
  return request.post(`/editor/projects/${projectId}/snapshots`, { schema })
}
