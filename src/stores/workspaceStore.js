import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getWorkspacesApi } from '@/api/auth'

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref([])
  const loading = ref(false)
  const error = ref('')
  const activeWorkspaceId = ref('')

  const activeWorkspace = computed(() => {
    return workspaces.value.find(item => item.id === activeWorkspaceId.value) || workspaces.value[0] || null
  })

  async function fetchWorkspaces() {
    try {
      loading.value = true
      error.value = ''
      workspaces.value = await getWorkspacesApi()
      if (!activeWorkspaceId.value && workspaces.value.length > 0) {
        activeWorkspaceId.value = workspaces.value[0].id
      }
      return workspaces.value
    } catch (err) {
      error.value = err?.message || '加载工作区失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    activeWorkspace,
    activeWorkspaceId,
    error,
    fetchWorkspaces,
    loading,
    workspaces,
  }
}, {
  persist: {
    pick: ['activeWorkspaceId']
  }
})
