import { request } from './request'

export async function getAssetsApi(params = {}) {
  return request.get('/assets', { params })
}

export async function uploadAssetApi(formData) {
  return request.post('/assets/upload', formData)
}

export async function updateAssetApi(id, data) {
  return request.patch(`/assets/${id}`, data)
}

export async function deleteAssetApi(id) {
  return request.delete(`/assets/${id}`)
}
