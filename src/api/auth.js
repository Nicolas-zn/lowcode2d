import { request } from './request'

export async function registerApi(data) {
  return request.post('/auth/register', data)
}

export async function loginApi(data) {
  return request.post('/auth/login', data)
}

export async function getUserInfoApi() {
  return request.get('/auth/me')
}

export async function refreshTokenApi() {
  return request.post('/auth/refresh')
}

export async function logoutApi() {
  return request.post('/auth/logout')
}

export async function getWorkspacesApi() {
  return request.get('/workspaces')
}
