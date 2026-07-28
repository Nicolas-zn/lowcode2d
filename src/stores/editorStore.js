import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createEditorSnapshotApi,
  getEditorProjectApi,
  saveEditorDraftApi
} from '@/api/editor'

export const useEditorStore = defineStore('editor', () => {
  const project = ref(null)
  const loading = ref(false)
  const error = ref('')
  const saveStatus = ref('idle')
  const lastSavedAt = ref(null)
  const draftUpdatedAt = ref(null)
  const lastSnapshot = ref(null)
  const lastSaveError = ref('')
  const dirtySince = ref(null)
  const saveRevision = ref(0)

  const hasUnsavedChanges = computed(() => {
    return ['dirty', 'saving', 'error', 'offline'].includes(saveStatus.value)
  })

  async function loadProject(projectId) {
    try {
      loading.value = true
      error.value = ''
      const data = await getEditorProjectApi(projectId)
      project.value = data.project
      draftUpdatedAt.value = data.draftUpdatedAt || null
      lastSavedAt.value = draftUpdatedAt.value || data.project?.updatedAt || null
      lastSaveError.value = ''
      dirtySince.value = null
      saveStatus.value = 'saved'
      return data
    } catch (err) {
      error.value = err?.message || '编辑器数据加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function saveDraft(projectId, schema) {
    const revision = ++saveRevision.value
    try {
      saveStatus.value = 'saving'
      lastSaveError.value = ''
      const data = await saveEditorDraftApi(projectId, schema, {
        updatedAt: draftUpdatedAt.value
      })
      if (revision === saveRevision.value) {
        saveStatus.value = 'saved'
        dirtySince.value = null
        draftUpdatedAt.value = data.updatedAt || new Date().toISOString()
        lastSavedAt.value = draftUpdatedAt.value
      }
      return data
    } catch (err) {
      saveStatus.value = 'error'
      lastSaveError.value = getRequestErrorMessage(err, '保存失败')
      throw err
    }
  }

  function markDirty() {
    if (!dirtySince.value) dirtySince.value = new Date().toISOString()
    if (saveStatus.value !== 'saving') {
      saveStatus.value = typeof navigator !== 'undefined' && navigator.onLine === false
        ? 'offline'
        : 'dirty'
    }
  }

  function markOffline() {
    if (hasUnsavedChanges.value || dirtySince.value) {
      saveStatus.value = 'offline'
    }
  }

  function resetSaveState(status = 'idle') {
    saveStatus.value = status
    lastSaveError.value = ''
    dirtySince.value = null
  }

  function getRequestErrorMessage(err, fallback) {
    const message = err?.response?.data?.message || err?.message || fallback
    if (err?.response?.status === 409) {
      return '草稿已在其他会话中更新，请刷新后再继续编辑'
    }
    return Array.isArray(message) ? message.join('；') : message
  }

  async function createSnapshot(projectId, schema) {
    const snapshot = await createEditorSnapshotApi(projectId, schema)
    lastSnapshot.value = snapshot
    saveStatus.value = 'saved'
    return snapshot
  }

  return {
    createSnapshot,
    dirtySince,
    draftUpdatedAt,
    error,
    hasUnsavedChanges,
    lastSavedAt,
    lastSaveError,
    lastSnapshot,
    loadProject,
    loading,
    markDirty,
    markOffline,
    project,
    resetSaveState,
    saveDraft,
    saveStatus
  }
})
