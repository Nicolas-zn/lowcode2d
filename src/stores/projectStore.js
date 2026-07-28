import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createProjectApi,
  duplicateProjectApi,
  getProjectsApi,
  restoreProjectApi,
  trashProjectApi,
  updateProjectApi
} from '@/api/projects'

export const useProjectStore = defineStore('project', () => {
  const projects = ref([])
  const loading = ref(false)
  const creating = ref(false)
  const error = ref('')
  const keyword = ref('')
  const status = ref('active')

  async function fetchProjects(workspaceId) {
    if (!workspaceId) {
      projects.value = []
      return []
    }

    try {
      loading.value = true
      error.value = ''
      projects.value = await getProjectsApi({
        workspaceId,
        status: status.value,
        keyword: keyword.value || undefined
      })
      return projects.value
    } catch (err) {
      error.value = err?.message || '加载项目失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createProject(payload) {
    try {
      creating.value = true
      const project = await createProjectApi(payload)
      projects.value = [project, ...projects.value]
      return project
    } finally {
      creating.value = false
    }
  }

  async function updateProject(id, payload) {
    const project = await updateProjectApi(id, payload)
    projects.value = projects.value.map(item => item.id === id ? project : item)
    return project
  }

  async function trashProject(id) {
    const project = await trashProjectApi(id)
    projects.value = projects.value.filter(item => item.id !== id)
    return project
  }

  async function restoreProject(id) {
    const project = await restoreProjectApi(id)
    projects.value = projects.value.map(item => item.id === id ? project : item)
    return project
  }

  async function duplicateProject(id, payload = {}) {
    const project = await duplicateProjectApi(id, payload)
    projects.value = [project, ...projects.value]
    return project
  }

  return {
    creating,
    createProject,
    duplicateProject,
    error,
    fetchProjects,
    keyword,
    loading,
    projects,
    restoreProject,
    status,
    trashProject,
    updateProject
  }
})
