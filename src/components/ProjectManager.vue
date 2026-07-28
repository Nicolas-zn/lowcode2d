<template>
  <div class="page-manager">
    <div class="page-tabs">
      <div v-for="proj in uniqueProjects" :key="proj.id" class="page-tab"
        :class="{ active: proj.id === currentProjectId }" @click="switchProject(proj.id)">
        <span>{{ proj.name }}</span>
        <el-icon v-if="uniqueProjects.length > 1" class="tab-close" @click.stop="removeProject(proj.id)">
          <Close />
        </el-icon>
      </div>

      <div class="page-tab add-tab" @click="showAddDialog = true">
        <el-icon>
          <Plus />
        </el-icon>
      </div>
    </div>

    <!-- 添加项目弹窗 -->
    <el-dialog v-model="showAddDialog" title="新增新项目" width="520px" :modal-append-to-body="false" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="项目名称">
          <el-input v-model="newProjName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="分辨率">
          <el-select v-model="newProjectResolution.type" placeholder="请选择设计分辨率" style="width: 100%" @change="handleResolutionChange">
            <el-option label="1080p（1920 × 1080）" value="1080p" />
            <el-option label="2K（2560 × 1440）" value="2k" />
            <el-option label="4K（3840 × 2160）" value="4k" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <div v-if="newProjectResolution.type === 'custom'" class="resolution-grid">
          <el-form-item label="宽度">
            <el-input-number v-model="newProjectResolution.width" :min="320" :max="10000" :step="10" controls-position="right" />
          </el-form-item>
          <el-form-item label="高度">
            <el-input-number v-model="newProjectResolution.height" :min="240" :max="10000" :step="10" controls-position="right" />
          </el-form-item>
        </div>
        <el-form-item label="选择布局">
          <div class="layout-categories">
            <div v-for="cat in layoutTemplates" :key="cat.category" class="category-block">
              <div class="category-title">{{ cat.category }}</div>
              <div class="layout-grid">
                <div v-if="cat.category === '通用布局'" class="layout-option" :class="{ selected: selectedLayout === null }" @click="selectedLayout = null">
                  <div class="layout-preview empty-layout">空白</div>
                  <span>空白项目</span>
                </div>
                <div v-for="tpl in cat.templates" :key="tpl.id" class="layout-option"
                  :class="{ selected: selectedLayout === tpl.id }" @click="selectedLayout = tpl.id">
                  <div class="layout-preview">
                    <LayoutIcon :layout="tpl.layout" :size="48" />
                  </div>
                  <span>{{ tpl.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetAddDialog">取消</el-button>
        <el-button type="primary" @click="addNewPage">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { Close, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePanelStore } from '../stores/panelStore'
import { getLayoutTemplates } from '../config/layoutTemplates'
import LayoutIcon from './LayoutIcon.vue'

const panelStore = usePanelStore()
const layoutTemplates = getLayoutTemplates()

const uniqueProjects = computed(() => {
  const projects = []
  const seen = new Set()
  panelStore.pages.forEach(p => {
    if (!seen.has(p.projectId)) {
      seen.add(p.projectId)
      projects.push({ id: p.projectId, name: p.projectName })
    }
  })
  return projects
})

const currentProjectId = computed(() => {
  return panelStore.currentProjectId
})

const switchProject = (id) => {
  panelStore.switchProject(id)
}

// 删除项目
const removeProject = async (id) => {
  const proj = uniqueProjects.value.find(p => p.id === id)
  try {
    await ElMessageBox.confirm(`确定删除「${proj.name}」的所有页面？`, '删除项目', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const beforeCount = uniqueProjects.value.length
    const removed = panelStore.removeProject(id)
    await nextTick()
    const afterCount = uniqueProjects.value.length
    if (removed && (afterCount < beforeCount || beforeCount === 1)) {
      ElMessage.success('项目已删除')
    } else {
      ElMessage.warning('项目删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

// 添加项目
const showAddDialog = ref(false)
const newProjName = ref('')
const selectedLayout = ref(null)
const RESOLUTION_PRESETS = {
  '1080p': { width: 1920, height: 1080 },
  '2k': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 }
}
const newProjectResolution = ref({
  type: '1080p',
  width: 1920,
  height: 1080
})

const handleResolutionChange = (value) => {
  const preset = RESOLUTION_PRESETS[value]
  if (!preset) return
  newProjectResolution.value.width = preset.width
  newProjectResolution.value.height = preset.height
}

const resetAddDialog = () => {
  showAddDialog.value = false
  newProjName.value = ''
  selectedLayout.value = null
  newProjectResolution.value = {
    type: '1080p',
    width: 1920,
    height: 1080
  }
}

const addNewPage = () => {
  const name = newProjName.value.trim() || `项目 ${uniqueProjects.value.length + 1}`
  const targetWidth = Number(newProjectResolution.value.width)
  const targetHeight = Number(newProjectResolution.value.height)

  if (!Number.isFinite(targetWidth) || !Number.isFinite(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
    ElMessage.warning('请输入有效的设计分辨率')
    return
  }

  const scaleX = targetWidth / 1920
  const scaleY = targetHeight / 1080

  let newPage = null
  if (selectedLayout.value) {
    const allTemplates = layoutTemplates.reduce((acc, cat) => acc.concat(cat.templates), [])
    const tpl = allTemplates.find(t => t.id === selectedLayout.value)
    if (tpl) {
      const layoutComponents = tpl.layout.map((item, j) => ({
        id: Date.now() + j + Math.random(),
        name: item.title,
        type: 'PlaceholderBrick',
        x: Math.round(item.x * scaleX),
        y: Math.round(item.y * scaleY),
        width: Math.round(item.width * scaleX),
        height: Math.round(item.height * scaleY),
        rotation: 0,
        props: { title: item.title },
        api: null, isBusinessComponent: false,
        echartTheme: '', colorPalette: '',
        locked: false, hidden: false, zIndex: j
      }))
      newPage = panelStore.addPage('页面 1', layoutComponents, true, name)
    }
  } else {
    newPage = panelStore.addPage('页面 1', [], true, name)
  }

  if (newPage) {
    panelStore.updateProjectSettings({
      designResolution: newProjectResolution.value.type,
      designWidth: targetWidth,
      designHeight: targetHeight
    }, {
      description: `设置项目分辨率: ${name}`
    })
  }

  resetAddDialog()
  ElMessage.success(`已添加项目: ${name}`)
}
</script>

<style scoped>
.page-manager {
  display: flex;
  align-items: center;
  height: 100%;
}

.page-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  overflow-x: auto;
  padding: 0 8px;
}

.page-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 0 0 6px 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-top: none;
  transition: all 0.2s;
  white-space: nowrap;
  user-select: none;
  height: 32px;
}

.page-tab:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color);
}

.page-tab.active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  font-weight: 600;
  border-color: var(--el-color-primary-light-5);
}

.tab-close {
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
  border-radius: 50%;
  padding: 2px;
}

.page-tab:hover .tab-close {
  opacity: 0.6;
}

.tab-close:hover {
  opacity: 1 !important;
  background: var(--el-color-danger-light-7);
  color: var(--el-color-danger);
}

.tab-input {
  width: 80px;
  border: 1px solid var(--el-color-primary);
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 13px;
  outline: none;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.add-tab {
  background: transparent;
  border: 1px dashed var(--el-border-color);
  color: var(--el-text-color-placeholder);
  padding: 4px 8px;
}

.add-tab:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.layout-categories {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.resolution-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-left: 80px;
}

.resolution-grid :deep(.el-form-item) {
  margin-bottom: 18px;
}

.resolution-grid :deep(.el-input-number) {
  width: 100%;
}

.category-title {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.layout-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 6px;
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.layout-option:hover {
  border-color: var(--el-color-primary-light-5);
}

.layout-option.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.layout-preview {
  width: 64px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-layout {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
}
</style>
