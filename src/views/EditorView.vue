<template>
  <div class="editor-view">
    <div v-if="editorStore.loading" class="editor-state-layer">
      <AppLoading text="正在加载编辑器数据..." size="large" />
    </div>

    <div v-else-if="editorStore.error" class="editor-state-layer">
      <AppError title="编辑器加载失败" :description="editorStore.error">
        <template #actions>
          <el-button @click="router.push('/workspace')">返回工作区</el-button>
          <el-button type="primary" @click="loadEditorProject">重试</el-button>
        </template>
      </AppError>
    </div>

    <!-- 左侧栏 -->
    <div class="sidebar-container">
      <Sidebar :component-count="componentCount" :selected-component-id="selectedComponentId"
        @select-layer="handleSelectLayer" />
    </div>

    <!-- 画布区域 -->
    <div class="canvas-container">


      <!-- 悬浮工具栏 -->
      <Toolbar :component-count="componentCount" :canvas-scale-percent="canvasScalePercent" @export-template="handleExportTemplate"
        :cover-loading="coverLoading" @set-cover="handleSetCover"
        @load-template="handleLoadTemplate" @publish-template="handlePublishTemplate" @clear-all="handleClearAll"
        @toggle-history="showHistoryDrawer = !showHistoryDrawer" @zoom-in="handleZoomIn" @zoom-out="handleZoomOut"
        @zoom-reset="handleZoomReset" @zoom-fit="handleZoomFit" />

      <div v-if="route.params.projectId" class="autosave-indicator" :class="editorStore.saveStatus">
        <span class="status-dot"></span>
        <span>{{ saveStatusText }}</span>
      </div>

      <CanvasPanel ref="canvasPanelRef" @update:component-count="componentCount = $event"
        @selected-change="handleCanvasSelectionChange" @scale-change="canvasScalePercent = $event" />

      <!-- 项目管理标签栏 -->
      <div class="page-manager-bar">
        <ProjectManager />
      </div>

      <!-- 历史记录抽屉 -->
      <el-drawer v-model="showHistoryDrawer" title="历史记录" direction="rtl" size="400px" :append-to-body="false"
        :modal="false" class="history-drawer" ref="historyDrawerRef">
        <HistoryPanel />
      </el-drawer>

    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import CanvasPanel from '../components/CanvasPanel.vue'
import Sidebar from '../components/Sidebar.vue'
import Toolbar from '../components/Toolbar.vue'
import HistoryPanel from '../components/HistoryPanel.vue'
import ProjectManager from '../components/ProjectManager.vue'
import AppError from '../components/common/AppError.vue'
import AppLoading from '../components/common/AppLoading.vue'
import { useEditorStore } from '../stores/editorStore'
import { usePanelStore } from '../stores/panelStore'
import { uploadProjectCoverApi } from '../api/projects'

const route = useRoute()
const router = useRouter()
const canvasPanelRef = ref(null)
const componentCount = ref(0)
const panelStore = usePanelStore()
const editorStore = useEditorStore()
const showHistoryDrawer = ref(false)
const historyDrawerRef = ref(null)
const selectedComponentId = ref(null)
const canvasScalePercent = ref(100)
const editorReady = ref(false)
const hydrating = ref(false)
const coverLoading = ref(false)
let saveTimer = null
let retryTimer = null
let pendingSchema = null
let savingDraft = false
let saveErrorShown = false
const saveStatusText = computed(() => {
  if (editorStore.saveStatus === 'dirty') return '待保存'
  if (editorStore.saveStatus === 'saving') return '保存中'
  if (editorStore.saveStatus === 'error') return '保存失败'
  if (editorStore.saveStatus === 'offline') return '离线待保存'
  if (editorStore.lastSavedAt) return `已保存 ${new Date(editorStore.lastSavedAt).toLocaleTimeString()}`
  return '待保存'
})

// 点击外部关闭抽屉
const handleClickOutside = (event) => {
  if (!showHistoryDrawer.value) return

  const drawerElement = document.querySelector('.history-drawer')
  if (drawerElement && !drawerElement.contains(event.target)) {
    showHistoryDrawer.value = false
  }
}

// 监听抽屉打开/关闭状态
watch(showHistoryDrawer, (newVal) => {
  if (newVal) {
    // 抽屉打开时，延迟添加点击监听器，避免立即触发
    nextTick(() => {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 100)
    })
  } else {
    // 抽屉关闭时，移除点击监听器
    document.removeEventListener('click', handleClickOutside)
  }
})

// 页面加载时初始化历史记录
onMounted(() => {
  loadEditorProject()
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// 组件卸载时清理监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (saveTimer) clearTimeout(saveTimer)
  if (retryTimer) clearTimeout(retryTimer)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

watch(() => route.params.projectId, () => {
  loadEditorProject()
})

watch(
  () => panelStore.exportEditorSchema(editorStore.project || { id: route.params.projectId }),
  (schema) => {
    if (!editorReady.value || hydrating.value || !route.params.projectId) return
    editorStore.markDirty()
    scheduleDraftSave(schema)
  },
  { deep: true }
)

onBeforeRouteLeave(async () => {
  if (!editorStore.hasUnsavedChanges) return true

  if (pendingSchema && navigator.onLine !== false) {
    try {
      await flushDraftSave({ silent: true })
      if (!editorStore.hasUnsavedChanges) return true
    } catch {
      // 交给下方确认框处理
    }
  }

  try {
    await ElMessageBox.confirm(
      '当前项目仍有未保存的编辑内容，离开后可能丢失最近改动。是否继续离开？',
      '离开编辑器',
      {
        confirmButtonText: '继续离开',
        cancelButtonText: '留在当前页',
        type: 'warning'
      }
    )
    return true
  } catch {
    return false
  }
})

const loadEditorProject = async () => {
  const projectId = route.params.projectId
  if (!projectId) {
    router.replace('/workspace')
    return
  }

  try {
    editorReady.value = false
    hydrating.value = true
    const data = await editorStore.loadProject(projectId)
    panelStore.loadEditorSchema(data.schema, data.project)
    await nextTick()
    panelStore.initHistory()
    editorStore.resetSaveState('saved')
    pendingSchema = null
    saveErrorShown = false
    editorReady.value = true
  } catch (error) {
    editorReady.value = false
  } finally {
    hydrating.value = false
  }
}

const scheduleDraftSave = (schema) => {
  pendingSchema = schema
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    flushDraftSave()
  }, 1200)
}

const flushDraftSave = async ({ silent = false } = {}) => {
  if (savingDraft || !pendingSchema || !route.params.projectId) return null
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }

  if (navigator.onLine === false) {
    editorStore.markOffline()
    return null
  }

  savingDraft = true
  const schemaToSave = pendingSchema
  pendingSchema = null
  let failed = false

  try {
    const result = await editorStore.saveDraft(route.params.projectId, schemaToSave)
    saveErrorShown = false
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    return result
  } catch (error) {
    failed = true
    pendingSchema = pendingSchema || schemaToSave
    if (!silent && !saveErrorShown) {
      saveErrorShown = true
      ElMessage.error(editorStore.lastSaveError || error?.message || '自动保存失败，请稍后重试')
    }
    if (error?.response?.status !== 409) {
      scheduleRetrySave()
    }
    throw error
  } finally {
    savingDraft = false
    if (!failed && pendingSchema && navigator.onLine !== false) {
      editorStore.markDirty()
      scheduleDraftSave(pendingSchema)
    }
  }
}

const scheduleRetrySave = () => {
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = setTimeout(() => {
    if (pendingSchema && navigator.onLine !== false) {
      flushDraftSave()
    }
  }, 5000)
}

const handleOnline = () => {
  if (pendingSchema) {
    editorStore.markDirty()
    scheduleDraftSave(pendingSchema)
  }
}

const handleOffline = () => {
  editorStore.markOffline()
}

const handleBeforeUnload = (event) => {
  if (!editorStore.hasUnsavedChanges) return
  event.preventDefault()
  event.returnValue = ''
}

const handleCanvasSelectionChange = (id) => {
  selectedComponentId.value = id
}

const handleZoomIn = () => {
  canvasPanelRef.value?.zoomIn()
}

const handleZoomOut = () => {
  canvasPanelRef.value?.zoomOut()
}

const handleZoomReset = () => {
  canvasPanelRef.value?.resetZoom()
}

const handleZoomFit = () => {
  canvasPanelRef.value?.fitCanvas()
}

// 处理工具栏事件，转发给 CanvasPanel
const handleExportTemplate = () => {
  canvasPanelRef.value?.openExportDialog()
}

const handleLoadTemplate = () => {
  canvasPanelRef.value?.triggerFileInput()
}

const handlePublishTemplate = async () => {
  if (route.params.projectId) {
    await editorStore.createSnapshot(
      route.params.projectId,
      panelStore.exportEditorSchema(editorStore.project || { id: route.params.projectId })
    )
    ElMessage.success('快照已创建')
  }
  canvasPanelRef.value?.publishTemplate()
}

const handleSetCover = async () => {
  const project = editorStore.project
  if (!project?.id || !project.workspaceId || coverLoading.value) return

  try {
    coverLoading.value = true
    const blob = await canvasPanelRef.value?.captureCoverImage()
    if (!blob) throw new Error('当前页面截图失败')

    const currentPage = panelStore.pages[panelStore.currentPageIndex]
    const fileName = `${project.name || 'project'}-${currentPage?.name || 'page'}-cover.jpg`
    const file = new File([blob], fileName, { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('file', file)

    const updatedProject = await uploadProjectCoverApi(project.id, formData)
    editorStore.project = { ...project, ...updatedProject }
    ElMessage.success('当前页面已设为项目封面')
  } catch (error) {
    ElMessage.error(error?.message || '设置项目封面失败')
  } finally {
    coverLoading.value = false
  }
}

const handleClearAll = () => {
  canvasPanelRef.value?.clearAll()
}

// 处理图层选择
const handleSelectLayer = (id) => {
  selectedComponentId.value = id
  // 通知 CanvasPanel 选中组件
  if (canvasPanelRef.value) {
    canvasPanelRef.value.selectComponent(id)
  }
}
</script>

<style scoped>
.editor-view {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
  position: relative;
  --sidebar-tab-rail-width: 76px;
}

.editor-state-layer {
  position: absolute;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: color-mix(in srgb, var(--lc-bg-page) 84%, transparent);
  backdrop-filter: blur(6px);
}

.sidebar-container {
  width: 400px;
  height: 100%;
  flex-shrink: 0;
  overflow: hidden;
}

/* 4K 显示器适配 */
@media screen and (min-width: 3840px) {
  .editor-view {
    --sidebar-tab-rail-width: 88px;
  }

  .sidebar-container {
    width: 450px;
  }
}

/* 2K 显示器适配 */
@media screen and (min-width: 2560px) and (max-width: 3839px) {
  .sidebar-container {
    width: 350px;
  }
}

.canvas-container {
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.autosave-indicator {
  position: absolute;
  right: 14px;
  bottom: 48px;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 11px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-md);
  background: var(--lc-bg-panel);
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-caption);
  box-shadow: var(--lc-shadow-sm);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--lc-text-tertiary);
}

.autosave-indicator.saving .status-dot {
  background: var(--lc-warning-600);
}

.autosave-indicator.dirty .status-dot {
  background: var(--lc-warning-600);
}

.autosave-indicator.saved .status-dot {
  background: var(--lc-success-600);
}

.autosave-indicator.offline {
  border-color: var(--lc-warning-200);
  color: var(--lc-warning-700);
}

.autosave-indicator.offline .status-dot {
  background: var(--lc-warning-600);
}

.autosave-indicator.error {
  border-color: var(--lc-danger-200);
  color: var(--lc-danger-600);
}

.autosave-indicator.error .status-dot {
  background: var(--lc-danger-600);
}

.page-manager-bar {
  position: fixed;
  bottom: 0;
  height: 36px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: flex-start;
  padding: 0 8px;
}

/* 历史记录抽屉样式 */
:deep(.history-drawer) {
  position: absolute !important;
  top: auto !important;
  bottom: 0 !important;
  right: 0 !important;
  left: auto !important;
  width: 400px !important;
  height: 500px !important;
  max-height: 60vh;
}

:deep(.history-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color);
}

:deep(.history-drawer .el-drawer__body) {
  padding: 0;
}
</style>
