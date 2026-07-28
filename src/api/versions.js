import { request } from './request'

export async function getVersionsApi(params = {}) {
  return request.get('/versions', { params })
}

export async function createVersionApi(data) {
  return request.post('/versions', data)
}

export async function rollbackVersionApi(id) {
  return request.post(`/versions/${id}/rollback`)
}
