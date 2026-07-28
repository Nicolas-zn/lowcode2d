import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { defineStore } from 'pinia'
import { getUserInfoApi, loginApi, logoutApi, refreshTokenApi, registerApi } from '@/api/auth'
import { clearAccessToken, setAccessToken } from '@/api/request'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const accessToken = ref('')
  const userInfo = ref(null)
  const loginLoading = ref(false)
  const sessionReady = ref(false)
  let sessionPromise = null

  async function authLogin(params, onSuccess) {
    try {
      loginLoading.value = true
      const data = await loginApi(params)
      applyAuthPayload(data)

      if (onSuccess) {
        await onSuccess()
      } else {
        await router.push('/workspace')
      }

      return { userInfo: userInfo.value, workspaces: data.workspaces || [] }
    } finally {
      loginLoading.value = false
    }
  }

  async function authRegister(params, onSuccess) {
    try {
      loginLoading.value = true
      const data = await registerApi(params)
      applyAuthPayload(data)

      if (onSuccess) {
        await onSuccess()
      } else {
        await router.push('/workspace')
      }

      return { userInfo: userInfo.value, workspace: data.workspace }
    } finally {
      loginLoading.value = false
    }
  }

  async function fetchUserInfo() {
    const data = await getUserInfoApi()
    userInfo.value = normalizeUser(data.user)
    return userInfo.value
  }

  async function loadSession() {
    if (sessionPromise) return sessionPromise

    if (accessToken.value && userInfo.value) {
      setAccessToken(accessToken.value)
      sessionReady.value = true
      return { accessToken: accessToken.value, user: userInfo.value }
    }

    sessionPromise = refreshSession()
    try {
      return await sessionPromise
    } finally {
      sessionPromise = null
    }
  }

  async function refreshSession() {
    try {
      const data = await refreshTokenApi()
      applyAuthPayload(data)
      return { accessToken: accessToken.value, user: userInfo.value }
    } catch {
      clearSession()
      return null
    } finally {
      sessionReady.value = true
    }
  }

  function hasCachedSession() {
    return Boolean(accessToken.value && userInfo.value)
  }

  async function logout(redirect = true) {
    try {
      await logoutApi()
    } finally {
      clearSession()
    }

    if (redirect) {
      await router.replace({
        path: '/login',
        query: { redirect: encodeURIComponent(router.currentRoute.value.fullPath) },
      })
    }
  }

  function applyAuthPayload(data) {
    accessToken.value = data.accessToken || ''
    userInfo.value = normalizeUser(data.user)
    setAccessToken(accessToken.value)
  }

  function clearSession() {
    accessToken.value = ''
    userInfo.value = null
    clearAccessToken()
  }

  function $reset() {
    loginLoading.value = false
  }

  function normalizeUser(user) {
    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      username: user.email,
      realName: user.displayName || user.email,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      metadata: {},
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('auth:refreshed', (event) => {
      applyAuthPayload(event.detail)
    })
    window.addEventListener('auth:expired', () => {
      clearSession()
    })
  }

  return {
    $reset,
    accessToken,
    authLogin,
    authRegister,
    fetchUserInfo,
    hasCachedSession,
    loadSession,
    loginLoading,
    logout,
    sessionReady,
    userInfo,
  }
}, {
  persist: {
    pick: ['accessToken', 'userInfo']
  }
})
