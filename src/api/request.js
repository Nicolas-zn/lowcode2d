import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE || '/api'
let accessToken = ''

export const request = axios.create({
  baseURL,
  timeout: 10_000,
  withCredentials: true,
})

const refreshRequest = axios.create({
  baseURL,
  timeout: 10_000,
  withCredentials: true,
})

request.interceptors.request.use(
  config => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    return unwrapResponse(response.data)
  },
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && originalRequest && !originalRequest.__isRetryRequest) {
      try {
        originalRequest.__isRetryRequest = true
        const refreshed = unwrapResponse((await refreshRequest.post('/auth/refresh')).data)
        setAccessToken(refreshed.accessToken)
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`
        window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: refreshed }))
        return request(originalRequest)
      } catch (refreshError) {
        clearAccessToken()
        window.dispatchEvent(new CustomEvent('auth:expired'))
        window.location.hash = '#/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)

export function setAccessToken(token) {
  accessToken = token || ''
}

export function clearAccessToken() {
  accessToken = ''
}

function unwrapResponse(res) {
  if (res && typeof res === 'object' && 'success' in res) {
    if (res.success) return res.data
    return Promise.reject(new Error(res.message || 'Request failed'))
  }
  if (res && typeof res === 'object' && 'code' in res) {
    if (res.code === 0 || res.code === 'OK') return res.data
    return Promise.reject(new Error(res.message || 'Request failed'))
  }
  return res
}
