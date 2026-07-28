import { request } from './request'

export async function getDatasourcesApi(params = {}) {
  return request.get('/datasources', { params })
}

export async function createDatasourceApi(data) {
  return request.post('/datasources', data)
}

export async function updateDatasourceApi(id, data) {
  return request.patch(`/datasources/${id}`, data)
}

export async function deleteDatasourceApi(id) {
  return request.delete(`/datasources/${id}`)
}

export async function testDatasourceApi(id) {
  return request.post(`/datasources/${id}/test`)
}
