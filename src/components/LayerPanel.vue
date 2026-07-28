<template>
  <div class="layer-panel">
    <div class="panel-header">
      <div class="header-row-1">
        <h3 class="header-title">图层管理</h3>
        <span class="header-count">{{ filteredComponents.length }}</span>
      </div>
      <div class="header-row-2">
        <el-input v-model="searchText" placeholder="搜索图层..." :prefix-icon="Search" size="small" clearable
          class="search-input" />
      </div>
      <div class="layer-filters">
        <button v-for="filter in layerFilters" :key="filter.value" type="button" class="filter-chip"
          :class="{ active: activeFilter === filter.value }" @click="activeFilter = filter.value">
          {{ filter.label }}
          <span>{{ filter.count }}</span>
        </button>
      </div>
      <div v-if="selectedIds.length > 0" class="bulk-toolbar">
        <span>已选 {{ selectedIds.length }} 个图层</span>
        <el-button size="small" text type="primary" @click="batchSetHidden(true)">隐藏</el-button>
        <el-button size="small" text type="primary" @click="batchSetHidden(false)">显示</el-button>
        <el-button size="small" text type="primary" @click="batchSetLocked(true)">锁定</el-button>
        <el-button size="small" text type="primary" @click="batchSetLocked(false)">解锁</el-button>
        <el-button size="small" text type="danger" @click="batchDelete">删除</el-button>
        <el-button size="small" text @click="clearSelection">取消</el-button>
      </div>
    </div>

    <div class="layer-list">
      <AppEmpty
        v-if="filteredComponents.length === 0"
        title="暂无匹配图层"
        description="请调整搜索关键词或筛选条件，也可以先从组件库拖入组件。"
        size="compact"
      >
        <template #actions>
          <el-button size="small" @click="clearFilters">清除筛选</el-button>
        </template>
      </AppEmpty>

      <div v-for="(component, index) in filteredComponents" :key="component.id" :class="['layer-item', {
        'active': selectedId === component.id,
        'hidden': component.hidden,
        'locked': component.locked,
        'dragging': draggingId === component.id,
        'drag-over': dragOverId === component.id && draggingId !== component.id
      }]" draggable="true" @click="selectLayer(component.id)" @dragstart="handleDragStart($event, component.id)"
        @dragover.prevent="handleDragOver(component.id)" @dragleave="handleDragLeave(component.id)"
        @drop.prevent="handleDrop(component.id)" @dragend="handleDragEnd">
        <!-- 顶部：图标和名称 -->
        <div class="layer-header">
          <el-checkbox :model-value="selectedIds.includes(component.id)" @change="toggleSelected(component.id)"
            @click.stop />
          <el-icon class="layer-icon">
            <component :is="getComponentIcon(component.type)" />
          </el-icon>

          <!-- 图层名称 -->
          <div class="layer-name" v-if="editingId !== component.id">
            <div class="layer-title">{{ getComponentTitle(component) }}</div>
            <div class="layer-type">{{ getComponentTypeName(component.type) }}</div>
          </div>

          <!-- 重命名输入框 -->
          <el-input v-else v-model="editingName" size="small" @blur="finishRename(component.id)"
            @keyup.enter="finishRename(component.id)" @click.stop ref="renameInput" />
        </div>

        <!-- 底部：操作栏 -->
        <div class="layer-actions">
          <!-- 可见性切换 -->
          <el-tooltip :content="component.hidden ? '显示' : '隐藏'" placement="top">
            <el-icon @click.stop="toggleHidden(component.id)">
              <View v-if="!component.hidden" />
              <Hide v-else />
            </el-icon>
          </el-tooltip>

          <!-- 锁定切换 -->
          <el-tooltip :content="component.locked ? '解锁' : '锁定'" placement="top">
            <el-icon @click.stop="toggleLock(component.id)">
              <Unlock v-if="!component.locked" />
              <Lock v-else />
            </el-icon>
          </el-tooltip>

          <!-- 更多操作 -->
          <el-dropdown @command="handleCommand($event, component.id)" trigger="click">
            <el-icon class="more-icon" @click.stop>
              <MoreFilled />
            </el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">
                  <el-icon>
                    <Edit />
                  </el-icon>
                  重命名
                </el-dropdown-item>
                <el-dropdown-item command="top" :disabled="index === 0">
                  <el-icon>
                    <Top />
                  </el-icon>
                  置顶
                </el-dropdown-item>
                <el-dropdown-item command="bottom" :disabled="index === filteredComponents.length - 1">
                  <el-icon>
                    <Bottom />
                  </el-icon>
                  置底
                </el-dropdown-item>
                <el-dropdown-item command="up" :disabled="index === 0">
                  <el-icon>
                    <ArrowUp />
                  </el-icon>
                  上移一层
                </el-dropdown-item>
                <el-dropdown-item command="down" :disabled="index === filteredComponents.length - 1">
                  <el-icon>
                    <ArrowDown />
                  </el-icon>
                  下移一层
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon>
                    <Delete />
                  </el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { usePanelStore } from '../stores/panelStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, View, Hide, Lock, Unlock, MoreFilled, Edit, Delete,
  Top, Bottom, ArrowUp, ArrowDown, Grid, Document, PieChart
} from '@element-plus/icons-vue'
import AppEmpty from './common/AppEmpty.vue'

const props = defineProps({
  selectedId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['select'])

const panelStore = usePanelStore()
const searchText = ref('')
const editingName = ref('')
const editingId = ref(null)
const renameInput = ref(null)
const draggingId = ref(null)
const dragOverId = ref(null)
const activeFilter = ref('all')
const selectedIds = ref([])

// 获取所有组件（按 z-index 排序，最上层的显示在最上面）
const components = computed(() => {
  return [...panelStore.components]
    .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
})

const layerFilterDefs = [
  { value: 'all', label: '全部', matcher: () => true },
  { value: 'visible', label: '显示', matcher: component => !component.hidden },
  { value: 'hidden', label: '隐藏', matcher: component => component.hidden },
  { value: 'locked', label: '锁定', matcher: component => component.locked }
]

const layerFilters = computed(() => {
  return layerFilterDefs.map(filter => ({
    ...filter,
    count: components.value.filter(filter.matcher).length
  }))
})

// 过滤后的组件列表
const filteredComponents = computed(() => {
  const filter = layerFilterDefs.find(item => item.value === activeFilter.value) || layerFilterDefs[0]
  const search = searchText.value.trim().toLowerCase()

  return components.value.filter(c =>
    filter.matcher(c) &&
    (
      !search ||
      String(c.name || '').toLowerCase().includes(search) ||
      String(c.props?.title || '').toLowerCase().includes(search) ||
      getComponentTypeName(c.type).toLowerCase().includes(search) ||
      String(c.type || '').toLowerCase().includes(search)
    )
  )
})

watch(() => components.value.map(component => component.id), (ids) => {
  const idSet = new Set(ids)
  selectedIds.value = selectedIds.value.filter(id => idSet.has(id))
})

// 选择图层
const selectLayer = (id) => {
  emit('select', id)
}

// 切换隐藏
const toggleHidden = (id) => {
  panelStore.toggleHidden(id)
}

// 切换锁定
const toggleLock = (id) => {
  panelStore.toggleLock(id)
}

const toggleSelected = (id) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(item => item !== id)
    : [...selectedIds.value, id]
}

const clearSelection = () => {
  selectedIds.value = []
}

const clearFilters = () => {
  searchText.value = ''
  activeFilter.value = 'all'
}

const batchSetHidden = (hidden) => {
  const changedCount = panelStore.batchSetComponentsHidden(selectedIds.value, hidden)
  if (changedCount > 0) {
    ElMessage.success(`已${hidden ? '隐藏' : '显示'} ${changedCount} 个图层`)
  }
  clearSelection()
}

const batchSetLocked = (locked) => {
  const changedCount = panelStore.batchSetComponentsLocked(selectedIds.value, locked)
  if (changedCount > 0) {
    ElMessage.success(`已${locked ? '锁定' : '解锁'} ${changedCount} 个图层`)
  }
  clearSelection()
}

const batchDelete = () => {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return

  ElMessageBox.confirm(`确定要删除已选的 ${ids.length} 个图层吗？该操作会从当前页面移除这些组件。`, '批量删除图层', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger'
  }).then(() => {
    const removedCount = panelStore.batchRemoveComponents(ids)
    if (removedCount > 0) {
      ElMessage.success(`已删除 ${removedCount} 个图层`)
    }
    clearSelection()
  }).catch(() => { })
}

const handleDragStart = (event, id) => {
  draggingId.value = id
  dragOverId.value = null
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(id))
}

const handleDragOver = (id) => {
  if (draggingId.value && draggingId.value !== id) {
    dragOverId.value = id
  }
}

const handleDragLeave = (id) => {
  if (dragOverId.value === id) {
    dragOverId.value = null
  }
}

const handleDrop = (targetId) => {
  const sourceId = draggingId.value
  if (!sourceId || sourceId === targetId) {
    handleDragEnd()
    return
  }

  const orderedIds = components.value.map(c => c.id)
  const sourceIndex = orderedIds.indexOf(sourceId)
  const targetIndex = orderedIds.indexOf(targetId)
  if (sourceIndex === -1 || targetIndex === -1) {
    handleDragEnd()
    return
  }

  const [movedId] = orderedIds.splice(sourceIndex, 1)
  orderedIds.splice(targetIndex, 0, movedId)
  panelStore.reorderComponentLayers(orderedIds)
  handleDragEnd()
}

const handleDragEnd = () => {
  draggingId.value = null
  dragOverId.value = null
}

// 处理下拉菜单命令
const handleCommand = (command, id) => {
  switch (command) {
    case 'rename':
      startRename(id)
      break
    case 'top':
      panelStore.moveComponentLayer(id, 'top')
      break
    case 'bottom':
      panelStore.moveComponentLayer(id, 'bottom')
      break
    case 'up':
      panelStore.moveComponentLayer(id, 'up')
      break
    case 'down':
      panelStore.moveComponentLayer(id, 'down')
      break
    case 'delete':
      deleteLayer(id)
      break
  }
}

// 开始重命名
const startRename = (id) => {
  const component = panelStore.components.find(c => c.id === id)
  if (component) {
    editingId.value = id
    editingName.value = component.name
    nextTick(() => {
      if (renameInput.value) {
        renameInput.value.focus()
      }
    })
  }
}

// 完成重命名
const finishRename = (id) => {
  const component = panelStore.components.find(c => c.id === id)
  if (component) {
    editingId.value = null
    if (editingName.value && editingName.value.trim()) {
      panelStore.renameComponent(id, editingName.value)
      ElMessage.success('重命名成功')
    }
  }
}

// 删除图层
const deleteLayer = (id) => {
  ElMessageBox.confirm('确定要删除这个组件吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    panelStore.removeComponent(id)
    selectedIds.value = selectedIds.value.filter(item => item !== id)
    ElMessage.success('删除成功')
  }).catch(() => { })
}

// 获取组件图标
const getComponentIcon = (type) => {
  const iconMap = {
    'TableBrick': Document,
    'EChartBrick': PieChart,
    'LineChartBrick': PieChart,
    'PieChartBrick': PieChart,
    'BarChartBrick': PieChart,
    'default': Grid
  }
  return iconMap[type] || iconMap.default
}

// 获取组件显示标题
const getComponentTitle = (component) => {
  // 优先显示组件的 title 属性
  if (component.props?.title) {
    return component.props.title
  }
  // 其次显示组件名称
  if (component.name) {
    return component.name
  }
  // 最后显示组件类型
  return getComponentTypeName(component.type)
}

// 获取组件类型名称
const getComponentTypeName = (type) => {
  const typeMap = {
    'TableBrick': '表格',
    'EChartBrick': '图表',
    'LineChartBrick': '折线图',
    'PieChartBrick': '饼图',
    'BarChartBrick': '柱状图',
    'HorizontalBarBrick': '横向柱状图',
    'RadarBrick': '雷达图',
    'GaugeBrick': '仪表盘',
    'FunnelBrick': '漏斗图',
    'StatCardBrick': '统计卡片',
    'TitleBrick': '标题',
    'HeaderBrick': '页头'
  }
  return typeMap[type] || '组件'
}
</script>


<style scoped>
.layer-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}

.panel-header {
  padding: 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-row-1 {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
}

.header-row-2 {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 100%;
  border-radius: 8px;
}

.layer-filters {
  display: flex;
  gap: var(--lc-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 2px;
}

.filter-chip {
  height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid var(--lc-border-subtle, var(--el-border-color-light));
  border-radius: 999px;
  background: var(--lc-bg-panel, var(--el-bg-color));
  color: var(--lc-text-secondary, var(--el-text-color-secondary));
  font-size: var(--lc-font-size-caption, 12px);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.filter-chip span {
  color: var(--lc-text-tertiary, var(--el-text-color-placeholder));
}

.filter-chip:hover,
.filter-chip.active {
  border-color: var(--lc-brand-500, var(--el-color-primary));
  background: var(--lc-bg-selected, var(--el-color-primary-light-9));
  color: var(--lc-brand-600, var(--el-color-primary));
}

.bulk-toolbar {
  min-height: 36px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid var(--lc-brand-200, var(--el-color-primary-light-7));
  border-radius: var(--lc-radius-md, 6px);
  background: var(--lc-bg-selected, var(--el-color-primary-light-9));
  color: var(--lc-text-secondary, var(--el-text-color-secondary));
  font-size: var(--lc-font-size-caption, 12px);
}

.bulk-toolbar > span {
  margin-right: 4px;
  color: var(--lc-text-primary, var(--el-text-color-primary));
  font-weight: 500;
}

.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.layer-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.layer-item:active {
  cursor: grabbing;
}

.layer-item:hover {
  background: var(--el-fill-color-light);
  border-color: var(--el-border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.layer-item.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.layer-item.dragging {
  opacity: 0.45;
  transform: scale(0.98);
}

.layer-item.drag-over {
  border-color: var(--el-color-primary);
  box-shadow: inset 0 0 0 1px var(--el-color-primary), 0 4px 12px rgba(64, 158, 255, 0.18);
}

.layer-item.hidden {
  opacity: 0.5;
}

.layer-item.locked {
  cursor: grab;
}

.layer-item .layer-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
  margin-bottom: 8px;
  border: none;
  padding: 0;
}

.layer-item .el-checkbox {
  height: 22px;
  margin-top: 1px;
}

.layer-icon {
  font-size: 20px;
  color: var(--el-color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.layer-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.layer-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-word;
  line-height: 1.4;
}

.layer-type {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.layer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.layer-actions .el-icon {
  font-size: 16px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 4px;
  border-radius: 4px;
}

.layer-actions .el-icon:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.more-icon {
  cursor: pointer;
}

/* 空状态样式 */
:deep(.el-empty) {
  padding: 60px 20px;
}

:deep(.el-empty__description) {
  margin-top: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
