import { request } from './request'

export async function getResourcesApi(params = {}) {
  return request.get('/resources', { params })
}

export async function createResourceApi(data) {
  return request.post('/resources', data)
}

export async function updateResourceApi(id, data) {
  return request.patch(`/resources/${id}`, data)
}

export async function deleteResourceApi(id) {
  return request.delete(`/resources/${id}`)
}

export async function testResourceApi(id) {
  return request.post(`/resources/${id}/test`)
}
