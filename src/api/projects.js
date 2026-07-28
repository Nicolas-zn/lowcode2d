import { request } from './request'

export async function getProjectsApi(params = {}) {
  return request.get('/projects', { params })
}

export async function createProjectApi(data) {
  return request.post('/projects', data)
}

export async function getProjectApi(id) {
  return request.get(`/projects/${id}`)
}

export async function updateProjectApi(id, data) {
  return request.patch(`/projects/${id}`, data)
}

export async function uploadProjectCoverApi(id, formData) {
  return request.post(`/projects/${id}/cover`, formData)
}

export async function trashProjectApi(id) {
  return request.delete(`/projects/${id}`)
}

export async function restoreProjectApi(id) {
  return request.post(`/projects/${id}/restore`)
}

export async function duplicateProjectApi(id, data = {}) {
  return request.post(`/projects/${id}/duplicate`, data)
}
