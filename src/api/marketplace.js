import { request } from './request'

export async function getMarketplaceItemsApi(params = {}) {
  return request.get('/marketplace', { params })
}

export async function getMarketplaceItemApi(id) {
  return request.get(`/marketplace/${id}`)
}

export async function forkMarketplaceItemApi(id, data) {
  return request.post(`/marketplace/${id}/fork`, data)
}

export async function likeMarketplaceItemApi(id) {
  return request.post(`/marketplace/${id}/like`)
}

export async function unlikeMarketplaceItemApi(id) {
  return request.delete(`/marketplace/${id}/like`)
}

export async function getMarketplaceCommentsApi(id) {
  return request.get(`/marketplace/${id}/comments`)
}

export async function createMarketplaceCommentApi(id, data) {
  return request.post(`/marketplace/${id}/comments`, data)
}
