import { request } from './request'

export async function getPublishesApi(params = {}) {
  return request.get('/publishes', { params })
}

export async function publishProjectApi(data) {
  return request.post('/publishes', data)
}

export async function updatePublishStatusApi(id, data) {
  return request.patch(`/publishes/${id}/status`, data)
}
