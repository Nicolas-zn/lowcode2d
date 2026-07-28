<template>
  <div class="canvas-panel">

    <!-- 隐藏的文件输入 -->
    <input ref="fileInput" type="file" accept=".json" style="display: none" @change="loadTemplate" />


    <!-- 组件编辑抽屉 -->
    <ComponentDrawer v-model="showDrawer" :component="selectedComponent" @duplicate="handleDrawerDuplicate"
      @save-as-business="handleDrawerSaveAsBusiness" @delete="handleDrawerDelete" />

    <!-- 导出对话框 -->
    <ExportDialog v-model="showExportDialog" :components="components" :canvas-element="canvasRef"
      :pages="panelStore.pages" :project-settings="panelStore.projectSettings"
      :project-settings-map="panelStore.projectSettingsMap" @export-complete="handleExportComplete" />

    <!-- 画布容器，带滚动 -->
    <div class="canvas-wrapper" ref="canvasWrapperRef">

      <!-- 标尺角落 -->
      <!-- <div class="ruler-corner"></div> -->

      <!-- 不可滚动的画布区域 -->
      <div class="canvas-noscroll">
        <div class="canvas-content" ref="canvasRef" data-cover-canvas @click="handleCanvasClick" @mousedown="handleCanvasMouseDown"
          @dragover.prevent @drop="handleCanvasDrop" :class="{ 'hide-grid': !panelStore.showGrid }"
          :style="canvasBgStyle">
          <div v-for="component in visibleComponents" :key="component.id" :ref="el => setComponentRef(el, component.id)"
            @mousedown="handleComponentMouseDown($event, component)" :style="{
              zIndex: component.zIndex || 0,
              position: 'absolute',
              left: component.x + 'px',
              top: component.y + 'px',
              width: component.width + 'px',
              height: component.height + 'px',
            }" :class="{
              'selected-component': selectedComponentId === component.id,
              'multi-selected-component': selectedComponentIds.includes(component.id) && selectedComponentId !== component.id,
              'readonly-item': readonly,
              'business-component': component.isBusinessComponent,
              'placeholder-item': component.type === 'PlaceholderBrick'
            }" class="canvas-item">
            <!-- 悬浮时显示的操作按钮组 -->
            <div v-if="!readonly && component.type !== 'PlaceholderBrick'" class="component-actions">
              <!-- 垃圾桶删除按钮 -->
              <div class="component-delete-trigger" @click.stop="removeComponent(component.id)">
                <el-icon :size="20">
                  <Delete />
                </el-icon>
                <span class="delete-tooltip">删除组件</span>
              </div>
              <!-- 拖动手柄按钮 -->
              <div class="component-drag-handle" @mousedown.stop.prevent="onHandleMouseDown($event, component)">
                <el-icon :size="20">
                  <Rank />
                </el-icon>
                <span class="drag-tooltip">拖动组件</span>
              </div>
              <!-- 作为底图按钮（仅 Cesium 组件显示） -->
              <div v-if="component.type === 'CesiumBrick'" class="component-basemap-trigger"
                @click.stop="setAsBaseMap(component.id)" title="作为底图">
                <el-icon :size="20">
                  <FullScreen />
                </el-icon>
              </div>
              <!-- 齿轮配置按钮 -->
              <div class="component-settings-trigger" @click.stop="openComponentDrawer(component.id)">
                <el-icon :size="20">
                  <Setting />
                </el-icon>
                <span class="settings-tooltip">点击配置</span>
              </div>
            </div>
            <SafeBrickRenderer :brick="brickComponents[component.type]" :component-config="component" />
          </div>
          <div v-if="alignmentGuides.vertical !== null" class="alignment-guide alignment-guide-vertical"
            :style="{ left: `${alignmentGuides.vertical}px` }"></div>
          <div v-if="alignmentGuides.horizontal !== null" class="alignment-guide alignment-guide-horizontal"
            :style="{ top: `${alignmentGuides.horizontal}px` }"></div>
          <div v-if="selectionBox.active" class="selection-box" :style="selectionBoxStyle"></div>

          <AppEmpty v-if="components.length === 0" :title="readonly ? '暂无组件' : '还没有组件'"
            :description="readonly ? '当前大屏暂未配置任何内容' : '从左侧拖入组件，或导入已有项目配置后继续编辑。'" :icon="Box"
            class="empty-state" size="large">
            <template v-if="!readonly" #actions>
              <el-button type="primary" :icon="Upload" @click.stop="triggerFileInput">导入项目</el-button>
              <el-button :icon="Grid" @click.stop="panelStore.toggleGrid()">
                {{ panelStore.showGrid ? '隐藏网格' : '显示网格' }}
              </el-button>
            </template>
          </AppEmpty>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import Moveable from 'moveable'
import { usePanelStore } from '../stores/panelStore'
import { useBusinessComponentStore } from '../stores/businessComponentStore'
import { brickComponents, brickLibrary } from '../bricks'
import { api } from '../lib/api'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Delete, Grid, Box, Upload, Setting, Rank, FullScreen } from '@element-plus/icons-vue'
import ComponentDrawer from './ComponentDrawer.vue'
import ExportDialog from './ExportDialog.vue'
import AppEmpty from './common/AppEmpty.vue'
import SafeBrickRenderer from './SafeBrickRenderer.vue'
import { exportToImage } from '../utils/exportUtils'

// Props
const props = defineProps({
  readonly: {
    type: Boolean,
    default: false
  }
})

const panelStore = usePanelStore()
const businessComponentStore = useBusinessComponentStore()
const canvasRef = ref(null)
const canvasWrapperRef = ref(null)
const fileInput = ref(null)
const selectedComponentId = ref(null)
const selectedComponentIds = ref([])
const canvasScale = ref(1)
const showDrawer = ref(false)
const showExportDialog = ref(false)
const copiedComponent = ref(null)
const copiedComponents = ref([])
const isCut = ref(false)
const alignmentGuides = ref({ vertical: null, horizontal: null })
const selectionBox = ref({
  active: false,
  additive: false,
  startX: 0,
  startY: 0,
  x: 0,
  y: 0,
  width: 0,
  height: 0
})
const actualCanvasScale = computed(() => canvasScale.value + 0.02)
const canvasScalePercent = computed(() => Math.round(actualCanvasScale.value * 100))
const designWidth = computed(() => panelStore.projectSettings?.designWidth || 1920)
const designHeight = computed(() => panelStore.projectSettings?.designHeight || 1080)
const selectionBoxStyle = computed(() => ({
  left: `${selectionBox.value.x}px`,
  top: `${selectionBox.value.y}px`,
  width: `${selectionBox.value.width}px`,
  height: `${selectionBox.value.height}px`
}))
const activeSelectionIds = computed(() => {
  if (selectedComponentIds.value.length > 0) return selectedComponentIds.value
  return selectedComponentId.value ? [selectedComponentId.value] : []
})
const selectedComponents = computed(() => {
  const idSet = new Set(activeSelectionIds.value)
  return components.value.filter(component => idSet.has(component.id))
})

// Moveable 实例和组件 refs
const moveableInstance = ref(null)
const componentRefs = ref({})

// 设置组件 ref
const setComponentRef = (el, id) => {
  if (el) {
    componentRefs.value[id] = el
  } else {
    delete componentRefs.value[id]
  }
}

const components = computed(() => {
  // 当前页的普通组件
  const currentComps = panelStore.components.filter(c => c.type !== 'MenuBrick' && c.type !== 'HeaderMenuBrick')

  // 全局组件（所有页面的导航菜单），保证单项目内各页状态唯一
  const currentPage = panelStore.pages[panelStore.currentPageIndex] || {}
  const currentProjectId = currentPage.projectId

  const globalComps = []
  panelStore.pages.filter(p => p.projectId === currentProjectId).forEach(page => {
    page.components.forEach(c => {
      if ((c.type === 'MenuBrick' || c.type === 'HeaderMenuBrick') && !globalComps.find(g => g.id === c.id)) {
        globalComps.push(c)
      }
    })
  })

  // 保证层级：导航菜单排在前面渲染
  return [...currentComps, ...globalComps].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
})

// 画布背景动态样式生成
const canvasBgStyle = computed(() => {
  const settings = panelStore.projectSettings || {}
  const bgColor = settings.backgroundColor || 'var(--color-bg-primary)'
  const bgImage = settings.backgroundImage

  // 基础变换
  const styles = {
    transform: `scale(${actualCanvasScale.value})`,
    backgroundColor: bgColor,
    width: `${designWidth.value}px`,
    height: `${designHeight.value}px`,
    minWidth: `${designWidth.value}px`,
    minHeight: `${designHeight.value}px`
  }

  // 背景贴图与网格逻辑合并层叠（利用多次 background 声明叠加）
  if (panelStore.showGrid) {
    if (bgImage) {
      styles.backgroundImage = `var(--grid-pattern), url(${bgImage})`
      styles.backgroundSize = `20px 20px, 100% 100%`
      styles.backgroundPosition = `0 0, center center`
      styles.backgroundRepeat = `repeat, no-repeat`
    } else {
      styles.backgroundImage = `var(--grid-pattern)`
      styles.backgroundSize = `20px 20px`
    }
  } else {
    // 隐藏网格
    if (bgImage) {
      styles.backgroundImage = `url(${bgImage})`
      styles.backgroundSize = `100% 100%`
      styles.backgroundPosition = `center center`
      styles.backgroundRepeat = `no-repeat`
    } else {
      styles.backgroundImage = `none`
    }
  }

  return styles
})

// 过滤隐藏的组件
const visibleComponents = computed(() => {
  return components.value.filter(c => !c.hidden)
})

// 获取选中的组件
const selectedComponent = computed(() => {
  if (!selectedComponentId.value) return null
  return components.value.find(c => c.id === selectedComponentId.value)
})

// Emits
const emit = defineEmits(['update:component-count', 'selected-change', 'scale-change'])

// 监听组件数量变化
watch(() => components.value.length, (newCount) => {
  emit('update:component-count', newCount)
  // 选中的组件被删除或画布被清空时，清除选中状态
  const componentIds = new Set(components.value.map(component => component.id))
  selectedComponentIds.value = selectedComponentIds.value.filter(id => componentIds.has(id))
  if (selectedComponentId.value && !components.value.find(c => c.id === selectedComponentId.value)) {
    selectedComponentId.value = null
    showDrawer.value = false
  }
}, { immediate: true })
// 监听选中的组件变化，更新 moveable 的目标
watch(selectedComponentId, async (newId) => {
  emit('selected-change', newId)
  await nextTick()
  updateMoveableTarget()
})

watch(selectedComponentIds, async () => {
  await nextTick()
  updateMoveableTarget()
}, { deep: true })

watch(canvasScalePercent, (value) => {
  emit('scale-change', value)
}, { immediate: true })

watch([designWidth, designHeight], async () => {
  await nextTick()
  calculateScale()
  updateMoveableTarget()
})

// 更新 moveable 的目标元素
const updateMoveableTarget = () => {
  if (!moveableInstance.value) return

  if (selectedComponentIds.value.length > 1) {
    moveableInstance.value.target = null
  } else if (selectedComponentId.value && componentRefs.value[selectedComponentId.value]) {
    const component = components.value.find(c => c.id === selectedComponentId.value)
    const isFullscreen = component?.width === designWidth.value && component?.height === designHeight.value && component?.x === 0 && component?.y === 0
    const isLocked = component?.locked || component?.type === 'PlaceholderBrick' || props.readonly || (component?.type === 'CesiumBrick' && isFullscreen)

    moveableInstance.value.target = componentRefs.value[selectedComponentId.value]
    moveableInstance.value.draggable = false  // 禁用拖动，只用手柄拖动
    moveableInstance.value.resizable = !isLocked
    moveableInstance.value.rotatable = false
  } else {
    moveableInstance.value.target = null
  }
}

// 吸附阈值（像素）
const SNAP_THRESHOLD = 5
const clearAlignmentGuides = () => {
  alignmentGuides.value = { vertical: null, horizontal: null }
}

const setSelectedIds = (ids) => {
  const selectableIds = new Set(
    components.value
      .filter(component => component.type !== 'PlaceholderBrick')
      .map(component => component.id)
  )
  const nextIds = [...new Set(ids)].filter(id => selectableIds.has(id))
  selectedComponentIds.value = nextIds
  selectedComponentId.value = nextIds[nextIds.length - 1] || null
  if (nextIds.length !== 1) {
    showDrawer.value = false
  }
}

const toggleSelectedId = (id) => {
  if (selectedComponentIds.value.includes(id)) {
    const nextIds = selectedComponentIds.value.filter(item => item !== id)
    setSelectedIds(nextIds)
    return
  }
  setSelectedIds([...selectedComponentIds.value, id])
}

const clearSelection = () => {
  selectedComponentIds.value = []
  selectedComponentId.value = null
  showDrawer.value = false
}

const getCanvasPoint = (event) => {
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min((event.clientX - rect.left) / actualCanvasScale.value, designWidth.value)),
    y: Math.max(0, Math.min((event.clientY - rect.top) / actualCanvasScale.value, designHeight.value))
  }
}

const rectsIntersect = (a, b) => {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
}

const getSelectionRect = () => ({
  x: selectionBox.value.x,
  y: selectionBox.value.y,
  width: selectionBox.value.width,
  height: selectionBox.value.height
})

const getSelectableComponentsInRect = (rect) => {
  return components.value
    .filter(component => component.type !== 'PlaceholderBrick' && !component.hidden)
    .filter(component => rectsIntersect(rect, {
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height
    }))
    .map(component => component.id)
}

const handleCanvasMouseDown = (event) => {
  if (props.readonly || event.button !== 0 || event.target !== canvasRef.value) return

  const startPoint = getCanvasPoint(event)
  selectionBox.value = {
    active: true,
    additive: event.shiftKey || event.metaKey || event.ctrlKey,
    startX: startPoint.x,
    startY: startPoint.y,
    x: startPoint.x,
    y: startPoint.y,
    width: 0,
    height: 0
  }

  if (!selectionBox.value.additive) {
    clearSelection()
  }

  window.addEventListener('mousemove', handleSelectionMouseMove)
  window.addEventListener('mouseup', handleSelectionMouseUp)
}

const handleSelectionMouseMove = (event) => {
  if (!selectionBox.value.active) return
  const point = getCanvasPoint(event)
  const x = Math.min(selectionBox.value.startX, point.x)
  const y = Math.min(selectionBox.value.startY, point.y)
  const width = Math.abs(point.x - selectionBox.value.startX)
  const height = Math.abs(point.y - selectionBox.value.startY)

  selectionBox.value = {
    ...selectionBox.value,
    x,
    y,
    width,
    height
  }
}

const handleSelectionMouseUp = () => {
  if (!selectionBox.value.active) return

  const rect = getSelectionRect()
  const selectedByBox = rect.width > 2 && rect.height > 2
    ? getSelectableComponentsInRect(rect)
    : []

  if (selectionBox.value.additive) {
    setSelectedIds([...selectedComponentIds.value, ...selectedByBox])
  } else {
    setSelectedIds(selectedByBox)
  }
  suppressNextCanvasClick = true
  window.setTimeout(() => {
    suppressNextCanvasClick = false
  }, 0)

  selectionBox.value = {
    active: false,
    additive: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }
  window.removeEventListener('mousemove', handleSelectionMouseMove)
  window.removeEventListener('mouseup', handleSelectionMouseUp)
}
// ========== 自定义拖拽（拖动手柄） ==========
let _dragging = false
let _dragId = null
let _dragIds = []
let _dragStartMap = new Map()
let _dragStartX = 0
let _dragStartY = 0
let _compStartX = 0
let _compStartY = 0
let suppressNextCanvasClick = false

const onHandleMouseDown = (e, comp) => {
  if (props.readonly) return
  _dragging = true
  _dragId = comp.id
  const groupIds = selectedComponentIds.value.includes(comp.id) && selectedComponentIds.value.length > 1
    ? selectedComponentIds.value
    : [comp.id]
  _dragIds = groupIds.filter(id => {
    const component = components.value.find(item => item.id === id)
    return component && !component.locked && component.type !== 'PlaceholderBrick'
  })
  _dragStartMap = new Map(
    _dragIds
      .map(id => components.value.find(component => component.id === id))
      .filter(Boolean)
      .map(component => [component.id, { x: component.x, y: component.y, width: component.width, height: component.height }])
  )
  _dragStartX = e.clientX
  _dragStartY = e.clientY
  _compStartX = comp.x
  _compStartY = comp.y
  panelStore.isDragging = true
  if (!selectedComponentIds.value.includes(comp.id)) {
    selectComponent(comp.id)
  } else {
    selectedComponentId.value = comp.id
  }
  window.addEventListener('mousemove', onHandleMouseMove)
  window.addEventListener('mouseup', onHandleMouseUp)
}

const onHandleMouseMove = (e) => {
  if (!_dragging || !_dragId) return
  const comp = components.value.find(c => c.id === _dragId)
  if (!comp) return

  const dx = (e.clientX - _dragStartX) / actualCanvasScale.value
  const dy = (e.clientY - _dragStartY) / actualCanvasScale.value
  const startEntries = [..._dragStartMap.values()]
  const groupBounds = startEntries.length > 1
    ? {
        minX: Math.min(...startEntries.map(item => item.x)),
        minY: Math.min(...startEntries.map(item => item.y)),
        maxX: Math.max(...startEntries.map(item => item.x + item.width)),
        maxY: Math.max(...startEntries.map(item => item.y + item.height))
      }
    : null
  const limitedDx = groupBounds
    ? Math.max(-groupBounds.minX, Math.min(dx, designWidth.value - groupBounds.maxX))
    : dx
  const limitedDy = groupBounds
    ? Math.max(-groupBounds.minY, Math.min(dy, designHeight.value - groupBounds.maxY))
    : dy
  let nx = _compStartX + limitedDx
  let ny = _compStartY + limitedDy
  const { width: w, height: h } = comp
  let verticalGuide = null
  let horizontalGuide = null

  // 边界约束
  if (!groupBounds) {
    nx = Math.max(0, Math.min(nx, designWidth.value - w))
    ny = Math.max(0, Math.min(ny, designHeight.value - h))
  }

  // 吸附
  const others = components.value.filter(c => !_dragIds.includes(c.id))
  for (const o of others) {
    const ol = o.x, or2 = o.x + o.width, ocx = o.x + o.width / 2
    const cl = nx, cr = nx + w, ccx = nx + w / 2
    if (Math.abs(cl - ol) < SNAP_THRESHOLD) { nx = ol; verticalGuide = ol; break }
    if (Math.abs(cr - or2) < SNAP_THRESHOLD) { nx = or2 - w; verticalGuide = or2; break }
    if (Math.abs(ccx - ocx) < SNAP_THRESHOLD) { nx = ocx - w / 2; verticalGuide = ocx; break }
    if (Math.abs(cl - or2) < SNAP_THRESHOLD) { nx = or2; verticalGuide = or2; break }
    if (Math.abs(cr - ol) < SNAP_THRESHOLD) { nx = ol - w; verticalGuide = ol; break }
  }
  for (const o of others) {
    const ot = o.y, ob = o.y + o.height, ocy = o.y + o.height / 2
    const ct = ny, cb = ny + h, ccy = ny + h / 2
    if (Math.abs(ct - ot) < SNAP_THRESHOLD) { ny = ot; horizontalGuide = ot; break }
    if (Math.abs(cb - ob) < SNAP_THRESHOLD) { ny = ob - h; horizontalGuide = ob; break }
    if (Math.abs(ccy - ocy) < SNAP_THRESHOLD) { ny = ocy - h / 2; horizontalGuide = ocy; break }
    if (Math.abs(ct - ob) < SNAP_THRESHOLD) { ny = ob; horizontalGuide = ob; break }
    if (Math.abs(cb - ot) < SNAP_THRESHOLD) { ny = ot - h; horizontalGuide = ot; break }
  }
  alignmentGuides.value = { vertical: verticalGuide, horizontal: horizontalGuide }

  // 更新 DOM 和数据
  if (_dragIds.length > 1) {
    _dragIds.forEach(id => {
      const start = _dragStartMap.get(id)
      if (!start) return
      const nextX = start.x + limitedDx
      const nextY = start.y + limitedDy
      const el = componentRefs.value[id]
      if (el) { el.style.left = nextX + 'px'; el.style.top = nextY + 'px' }
      panelStore.updateComponent(id, { x: nextX, y: nextY })
    })
  } else {
    const el = componentRefs.value[_dragId]
    if (el) { el.style.left = nx + 'px'; el.style.top = ny + 'px' }
    panelStore.updateComponent(_dragId, { x: nx, y: ny })
  }
}

const onHandleMouseUp = () => {
  if (_dragging && _dragId) {
    if (_dragIds.length > 1) {
      panelStore.saveHistory({
        type: 'move_component',
        description: `移动组件 (${_dragIds.length} 个)`,
        details: { ids: [..._dragIds] }
      })
    } else {
      snapToPlaceholder(_dragId)
      panelStore.saveTransformHistory(_dragId, 'move')
    }
    // 刷新 Moveable 选中框位置
    if (moveableInstance.value) {
      moveableInstance.value.updateTarget()
    }
  }
  _dragging = false
  _dragId = null
  _dragIds = []
  _dragStartMap = new Map()
  clearAlignmentGuides()
  panelStore.isDragging = false
  window.removeEventListener('mousemove', onHandleMouseMove)
  window.removeEventListener('mouseup', onHandleMouseUp)
}

// 当前正在拖拽/调整大小的组件ID
const currentTransformingId = ref(null)
const currentTransformType = ref(null) // 'drag' 或 'resize' 或 'rotate'
let pendingResizeUpdate = null
let resizeStartRect = null

const onMoveResizeStart = () => {
  const component = components.value.find(c => c.id === selectedComponentId.value)
  resizeStartRect = component
    ? { x: component.x, y: component.y, width: component.width, height: component.height }
    : null
}

// Moveable 拖动事件
const onMoveDrag = ({ target, left, top }) => {
  if (props.readonly || !selectedComponentId.value) return

  // 记录正在拖拽的组件
  if (!currentTransformingId.value) {
    currentTransformingId.value = selectedComponentId.value
    currentTransformType.value = 'drag'
  }

  const component = components.value.find(c => c.id === selectedComponentId.value)
  if (!component) return

  // 吸附逻辑
  let snappedX = left
  let snappedY = top
  const { width, height } = component
  let snappedHorizontal = false
  let snappedVertical = false
  let verticalGuide = null
  let horizontalGuide = null

  // 获取其他组件
  const otherComponents = components.value.filter(c => c.id !== selectedComponentId.value)

  // 检查水平对齐
  for (const other of otherComponents) {
    if (snappedHorizontal) break

    const otherLeft = other.x
    const otherRight = other.x + other.width
    const otherCenterX = other.x + other.width / 2

    const currentLeft = left
    const currentRight = left + width
    const currentCenterX = left + width / 2

    // 左边对齐
    if (Math.abs(currentLeft - otherLeft) < SNAP_THRESHOLD) {
      snappedX = otherLeft
      verticalGuide = otherLeft
      snappedHorizontal = true
    }
    // 右边对齐
    else if (Math.abs(currentRight - otherRight) < SNAP_THRESHOLD) {
      snappedX = otherRight - width
      verticalGuide = otherRight
      snappedHorizontal = true
    }
    // 水平居中对齐
    else if (Math.abs(currentCenterX - otherCenterX) < SNAP_THRESHOLD) {
      snappedX = otherCenterX - width / 2
      verticalGuide = otherCenterX
      snappedHorizontal = true
    }
    // 左对右
    else if (Math.abs(currentLeft - otherRight) < SNAP_THRESHOLD) {
      snappedX = otherRight
      verticalGuide = otherRight
      snappedHorizontal = true
    }
    // 右对左
    else if (Math.abs(currentRight - otherLeft) < SNAP_THRESHOLD) {
      snappedX = otherLeft - width
      verticalGuide = otherLeft
      snappedHorizontal = true
    }
  }

  // 检查垂直对齐
  for (const other of otherComponents) {
    if (snappedVertical) break

    const otherTop = other.y
    const otherBottom = other.y + other.height
    const otherCenterY = other.y + other.height / 2

    const currentTop = top
    const currentBottom = top + height
    const currentCenterY = top + height / 2

    // 顶部对齐
    if (Math.abs(currentTop - otherTop) < SNAP_THRESHOLD) {
      snappedY = otherTop
      horizontalGuide = otherTop
      snappedVertical = true
    }
    // 底部对齐
    else if (Math.abs(currentBottom - otherBottom) < SNAP_THRESHOLD) {
      snappedY = otherBottom - height
      horizontalGuide = otherBottom
      snappedVertical = true
    }
    // 垂直居中对齐
    else if (Math.abs(currentCenterY - otherCenterY) < SNAP_THRESHOLD) {
      snappedY = otherCenterY - height / 2
      horizontalGuide = otherCenterY
      snappedVertical = true
    }
    // 上对下
    else if (Math.abs(currentTop - otherBottom) < SNAP_THRESHOLD) {
      snappedY = otherBottom
      horizontalGuide = otherBottom
      snappedVertical = true
    }
    // 下对上
    else if (Math.abs(currentBottom - otherTop) < SNAP_THRESHOLD) {
      snappedY = otherTop - height
      horizontalGuide = otherTop
      snappedVertical = true
    }
  }
  alignmentGuides.value = { vertical: verticalGuide, horizontal: horizontalGuide }

  // 更新位置
  target.style.left = `${snappedX}px`
  target.style.top = `${snappedY}px`
  panelStore.updateComponent(selectedComponentId.value, { x: snappedX, y: snappedY })
}

// Moveable 缩放事件
const onMoveResize = ({ target, width, height, drag, direction }) => {
  if (props.readonly || !selectedComponentId.value) return

  if (!currentTransformingId.value) {
    currentTransformingId.value = selectedComponentId.value
    currentTransformType.value = 'resize'
    if (!resizeStartRect) onMoveResizeStart()
  }

  const nextX = resizeStartRect && direction?.[0] < 0
    ? resizeStartRect.x + resizeStartRect.width - width
    : (resizeStartRect?.x ?? drag.left)
  const nextY = resizeStartRect && direction?.[1] < 0
    ? resizeStartRect.y + resizeStartRect.height - height
    : (resizeStartRect?.y ?? drag.top)

  target.style.width = `${width}px`
  target.style.height = `${height}px`
  target.style.left = `${nextX}px`
  target.style.top = `${nextY}px`

  pendingResizeUpdate = {
    id: selectedComponentId.value,
    x: nextX,
    y: nextY,
    width,
    height
  }
}

// Moveable 旋转事件
const onMoveRotate = ({ target, rotate }) => {
  if (props.readonly || !selectedComponentId.value) return

  // 记录正在旋转的组件
  if (!currentTransformingId.value) {
    currentTransformingId.value = selectedComponentId.value
    currentTransformType.value = 'rotate'
  }

  target.style.transform = `rotate(${rotate}deg)`
  panelStore.updateComponent(selectedComponentId.value, { rotation: rotate })
}

// 拖动/缩放/旋转结束
const onMoveEnd = () => {
  if (currentTransformingId.value) {
    const actionType = currentTransformType.value === 'resize' ? 'resize' :
      currentTransformType.value === 'rotate' ? 'rotate' : 'move'

    if (actionType === 'resize' && pendingResizeUpdate) {
      const { id, ...updates } = pendingResizeUpdate
      panelStore.updateComponent(id, updates)
      pendingResizeUpdate = null
      resizeStartRect = null
    }

    if (actionType === 'move') {
      snapToPlaceholder(currentTransformingId.value)
    }

    panelStore.saveTransformHistory(currentTransformingId.value, actionType)
    currentTransformingId.value = null
    currentTransformType.value = null
    clearAlignmentGuides()
  } else {
    pendingResizeUpdate = null
    resizeStartRect = null
    clearAlignmentGuides()
  }
}

const getOverlapArea = (rectA, rectB) => {
  const left = Math.max(rectA.x, rectB.x)
  const top = Math.max(rectA.y, rectB.y)
  const right = Math.min(rectA.x + rectA.width, rectB.x + rectB.width)
  const bottom = Math.min(rectA.y + rectA.height, rectB.y + rectB.height)

  if (right <= left || bottom <= top) return 0
  return (right - left) * (bottom - top)
}

const snapToPlaceholder = (componentId) => {
  const component = components.value.find(c => c.id === componentId)
  // 互动按钮这类悬浮组件不参与模板容器的强吸附占满逻辑
  if (!component || component.type === 'PlaceholderBrick' || component.type === 'ButtonBrick') return

  const componentArea = Math.max(component.width * component.height, 1)
  const placeholder = components.value
    .filter(c => c.type === 'PlaceholderBrick' && c.id !== componentId)
    .map(c => ({
      placeholder: c,
      overlapArea: getOverlapArea(component, c)
    }))
    .filter(item => item.overlapArea > 0)
    .sort((a, b) => b.overlapArea - a.overlapArea)
    .find(item => item.overlapArea / componentArea >= 0.15)?.placeholder

  if (placeholder) {
    // 检测占位符区域是否已有其他组件，直接替换
    const existingComp = components.value.find(c => {
      if (c.id === componentId || c.type === 'PlaceholderBrick') return false
      return (
        Math.abs(c.x - placeholder.x) < 5 &&
        Math.abs(c.y - placeholder.y) < 5 &&
        Math.abs(c.width - placeholder.width) < 5 &&
        Math.abs(c.height - placeholder.height) < 5
      )
    })
    if (existingComp) {
      panelStore.removeComponent(existingComp.id)
    }

    // 将组件的位置和大小设为占满占位符
    panelStore.updateComponent(componentId, {
      x: placeholder.x,
      y: placeholder.y,
      width: placeholder.width,
      height: placeholder.height
    })

    // 同步 DOM 样式，避免视觉滞后
    const el = componentRefs.value[componentId]
    if (el) {
      el.style.left = `${placeholder.x}px`
      el.style.top = `${placeholder.y}px`
      el.style.width = `${placeholder.width}px`
      el.style.height = `${placeholder.height}px`
    }

    // 刷新 Moveable
    nextTick(() => {
      updateMoveableTarget()
    })
  }
}

// 应用布局模板（从侧边栏拖拽处理）
const applyLayoutTemplate = async (template) => {
  try {
    if (panelStore.components.length > 0) {
      await ElMessageBox.confirm(
        `应用布局模板"${template.name}"会清空当前画布，是否继续？`,
        '确认应用布局',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      panelStore.clearComponents()
    }

    template.layout.forEach(item => {
      const component = {
        type: 'PlaceholderBrick',
        name: item.title,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        props: {
          title: item.title
        }
      }
      panelStore.addComponent(component)
    })

    ElMessage.success(`已应用布局模板: ${template.name}`)
    // 清除移动框选中状态
    clearSelection()
    nextTick(() => {
      updateMoveableTarget()
    })
  } catch {
    // 用户取消
  }
}

// 从侧边栏拖拽到画布的 drop 处理
const snapToPlaceholderByPoint = (componentId, pointX, pointY) => {
  const placeholder = components.value.find(c => {
    if (c.type !== 'PlaceholderBrick' || c.id === componentId) return false
    return (
      pointX >= c.x &&
      pointX <= c.x + c.width &&
      pointY >= c.y &&
      pointY <= c.y + c.height
    )
  })

  if (!placeholder) return false

  const existingComp = components.value.find(c => {
    if (c.id === componentId || c.type === 'PlaceholderBrick') return false
    return (
      Math.abs(c.x - placeholder.x) < 5 &&
      Math.abs(c.y - placeholder.y) < 5 &&
      Math.abs(c.width - placeholder.width) < 5 &&
      Math.abs(c.height - placeholder.height) < 5
    )
  })

  if (existingComp) {
    panelStore.removeComponent(existingComp.id)
  }

  panelStore.updateComponent(componentId, {
    x: placeholder.x,
    y: placeholder.y,
    width: placeholder.width,
    height: placeholder.height
  })

  const el = componentRefs.value[componentId]
  if (el) {
    el.style.left = `${placeholder.x}px`
    el.style.top = `${placeholder.y}px`
    el.style.width = `${placeholder.width}px`
    el.style.height = `${placeholder.height}px`
  }

  nextTick(() => {
    updateMoveableTarget()
  })

  return true
}

const handleCanvasDrop = (event) => {
  event.preventDefault()
  if (props.readonly) return

  let dragData
  try {
    dragData = JSON.parse(event.dataTransfer.getData('application/json'))
  } catch {
    return
  }
  if (!dragData) return

  // 如果拖入的是布局模板
  if (dragData.source === 'layout-template' && dragData.template) {
    applyLayoutTemplate(dragData.template)
    return
  }

  if (!dragData.type) return

  // 防止添加多个导航菜单组件
  if (dragData.type === 'MenuBrick' || dragData.type === 'HeaderMenuBrick') {
    const hasMenu = panelStore.pages.some(page =>
      page.components.some(c => c.type === 'MenuBrick' || c.type === 'HeaderMenuBrick')
    )
    if (hasMenu) {
      ElMessageBox.alert('一个项目只能配置一个导航菜单组件', '提示', {
        type: 'warning',
        confirmButtonText: '知道了'
      })
      return
    }
  }

  // 计算落点在画布中的实际坐标（考虑缩放和偏移）
  const canvasRect = canvasRef.value.getBoundingClientRect()
  const dropX = Math.round((event.clientX - canvasRect.left) / actualCanvasScale.value)
  const dropY = Math.round((event.clientY - canvasRect.top) / actualCanvasScale.value)

  // 计算组件位置（以鼠标位置为中心）
  const compX = Math.max(0, Math.min(designWidth.value - dragData.defaultWidth, dropX - dragData.defaultWidth / 2))
  const compY = Math.max(0, Math.min(designHeight.value - dragData.defaultHeight, dropY - dragData.defaultHeight / 2))

  const newComp = panelStore.addComponent({
    name: dragData.name,
    type: dragData.type,
    x: compX,
    y: compY,
    width: dragData.defaultWidth,
    height: dragData.defaultHeight,
    props: { title: dragData.name, ...dragData.defaultProps },
    api: dragData.api || null,
    isBusinessComponent: dragData.isBusinessComponent || false
  })

  // 延迟选中，避免与 addComponent 在同一更新周期触发递归
  nextTick(() => {
    setSelectedIds([newComp.id])

    const snappedByPoint = snapToPlaceholderByPoint(newComp.id, dropX, dropY)
    if (!snappedByPoint) {
      snapToPlaceholder(newComp.id)
    }
  })

  ElMessage.success(`已添加 ${dragData.name}`)
}

// 兼容旧的方法名（保持向后兼容）
const onDragging = (id, x, y) => {
  panelStore.updateComponent(id, { x, y })
}

const onDragStop = () => {
  onMoveEnd()
}

const onResize = (id, x, y, width, height) => {
  panelStore.updateComponent(id, { x, y, width, height })
}

// 选中组件（不打开抽屉）
const selectComponent = (id) => {
  if (props.readonly) return
  const component = components.value.find(c => c.id === id)
  if (!component || component.type === 'PlaceholderBrick') return
  setSelectedIds([id])
  if (moveableInstance.value && componentRefs.value[id]) {
    const isFullscreen = component.width === designWidth.value && component.height === designHeight.value && component.x === 0 && component.y === 0
    const isLocked = component.locked || (component.type === 'CesiumBrick' && isFullscreen)
    moveableInstance.value.target = componentRefs.value[id]
    moveableInstance.value.draggable = false
    moveableInstance.value.resizable = !isLocked
    moveableInstance.value.rotatable = false
    moveableInstance.value.updateTarget()
  }
}

const handleComponentMouseDown = (event, component) => {
  if (props.readonly || component.type === 'PlaceholderBrick') return

  if (event.shiftKey || event.metaKey || event.ctrlKey) {
    event.stopPropagation()
    toggleSelectedId(component.id)
    return
  }

  if (!selectedComponentIds.value.includes(component.id) || selectedComponentIds.value.length <= 1) {
    selectComponent(component.id)
  } else {
    selectedComponentId.value = component.id
  }
}

// 打开组件配置抽屉
const openComponentDrawer = (id) => {
  setSelectedIds([id])
  showDrawer.value = true
}

// 点击画布空白处
const handleCanvasClick = (event) => {
  if (suppressNextCanvasClick) return
  // 如果点击的是画布本身（不是组件），清除选中
  if (event.target === canvasRef.value) {
    clearSelection()
  }
}

// 抽屉事件处理函数
const handleDrawerDuplicate = () => {
  if (!selectedComponentId.value) return
  duplicateComponent(selectedComponentId.value)
}

const handleDrawerSaveAsBusiness = () => {
  if (!selectedComponentId.value) return
  saveAsBusinessComponent(selectedComponentId.value)
}

const handleDrawerDelete = () => {
  if (!selectedComponentId.value) return
  removeComponent(selectedComponentId.value)
  showDrawer.value = false // 删除后关闭抽屉
}

// 键盘事件处理
const handleKeyDown = (event) => {
  // 只读模式下禁用键盘事件
  if (props.readonly) return

  // 检查当前焦点是否在输入框、文本域或可编辑元素中
  const activeElement = document.activeElement
  const isInputFocused = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.isContentEditable ||
    activeElement.closest('.el-input') ||
    activeElement.closest('.el-textarea') ||
    activeElement.closest('.el-select')
  )

  // 如果焦点在输入框中，只允许撤销/重做快捷键
  if (isInputFocused) {
    // 允许撤销/重做
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      // 不阻止默认行为，让输入框自己处理
      return
    }
    // 其他快捷键都不处理
    return
  }

  // 撤销/重做快捷键（全局有效，不需要选中组件）
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    panelStore.undo()
    return
  }

  if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.shiftKey && event.key === 'z'))) {
    event.preventDefault()
    panelStore.redo()
    return
  }

  // 粘贴快捷键（全局有效，不需要选中组件）
  if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
    event.preventDefault()
    pasteComponent()
    return
  }

  // 以下操作需要选中组件
  if (activeSelectionIds.value.length === 0) return

  const component = components.value.find(c => c.id === selectedComponentId.value)
  const selectedMovableComponents = selectedComponents.value.filter(item => !item.locked)
  if (!component && selectedMovableComponents.length === 0) return

  // 复制快捷键 Ctrl+C
  if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
    event.preventDefault()
    copySelectedComponents()
    return
  }

  // 剪切快捷键 Ctrl+X
  if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
    event.preventDefault()
    cutSelectedComponents()
    return
  }

  // 快速复制快捷键 Ctrl+D
  if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
    event.preventDefault()
    duplicateSelectedComponents()
    return
  }

  // 删除快捷键 Delete 或 Backspace
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    removeSelectedComponents()
    return
  }

  // 按住 Shift 键时移动距离为 10px，否则为 1px
  const step = event.shiftKey ? 10 : 1

  const selectionBounds = {
    minX: Math.min(...selectedMovableComponents.map(item => item.x)),
    minY: Math.min(...selectedMovableComponents.map(item => item.y)),
    maxX: Math.max(...selectedMovableComponents.map(item => item.x + item.width)),
    maxY: Math.max(...selectedMovableComponents.map(item => item.y + item.height))
  }
  let dx = 0
  let dy = 0

  switch (event.key) {
    case 'ArrowUp':
      dy = -Math.min(step, selectionBounds.minY)
      event.preventDefault()
      break
    case 'ArrowDown':
      dy = Math.min(step, designHeight.value - selectionBounds.maxY)
      event.preventDefault()
      break
    case 'ArrowLeft':
      dx = -Math.min(step, selectionBounds.minX)
      event.preventDefault()
      break
    case 'ArrowRight':
      dx = Math.min(step, designWidth.value - selectionBounds.maxX)
      event.preventDefault()
      break
    default:
      return
  }

  if (dx !== 0 || dy !== 0) {
    selectedMovableComponents.forEach(item => {
      panelStore.updateComponent(item.id, { x: item.x + dx, y: item.y + dy })
    })
    panelStore.saveHistory({
      type: 'move_component',
      description: selectedMovableComponents.length > 1
        ? `移动组件 (${selectedMovableComponents.length} 个)`
        : `移动组件: ${selectedMovableComponents[0].name}`,
      details: { ids: selectedMovableComponents.map(item => item.id), dx, dy }
    })
  }
}

// 复制组件到剪贴板 (Ctrl+C)
const copySelectedComponents = () => {
  const selection = selectedComponents.value.filter(component => component.type !== 'PlaceholderBrick')
  if (selection.length === 0) {
    ElMessage.warning('请先选择要复制的组件')
    return
  }

  copiedComponents.value = JSON.parse(JSON.stringify(selection))
  copiedComponent.value = copiedComponents.value[0] || null
  isCut.value = false

  ElMessage.success(selection.length > 1 ? `已复制 ${selection.length} 个组件` : '组件已复制到剪贴板')
}

const copyComponent = () => {
  copySelectedComponents()
}

// 剪切组件到剪贴板 (Ctrl+X)
const cutSelectedComponents = () => {
  const ids = [...activeSelectionIds.value]
  const selection = selectedComponents.value.filter(component => component.type !== 'PlaceholderBrick')
  if (selection.length === 0) {
    ElMessage.warning('请先选择要剪切的组件')
    return
  }

  copiedComponents.value = JSON.parse(JSON.stringify(selection))
  copiedComponent.value = copiedComponents.value[0] || null
  isCut.value = true
  panelStore.batchRemoveComponents(ids)
  clearSelection()
  ElMessage.success(selection.length > 1 ? `已剪切 ${selection.length} 个组件` : '组件已剪切到剪贴板')
}

const cutComponent = () => {
  cutSelectedComponents()
}

// 从剪贴板粘贴组件 (Ctrl+V)
const pasteComponent = () => {
  const sourceComponents = copiedComponents.value.length > 0
    ? copiedComponents.value
    : (copiedComponent.value ? [copiedComponent.value] : [])

  if (sourceComponents.length === 0) {
    ElMessage.warning('剪贴板为空，请先复制或剪切组件')
    return
  }

  // 防止添加多个导航菜单组件
  if (sourceComponents.some(component => component.type === 'MenuBrick' || component.type === 'HeaderMenuBrick')) {
    const hasMenu = panelStore.pages.some(page =>
      page.components.some(c => c.type === 'MenuBrick' || c.type === 'HeaderMenuBrick')
    )
    if (hasMenu) {
      ElMessageBox.alert('一个项目只能配置一个导航菜单组件', '提示', {
        type: 'warning',
        confirmButtonText: '知道了'
      })
      return
    }
  }

  const pastedComponents = sourceComponents.map((component, index) => ({
    ...component,
    id: Date.now() + Math.random() + index,
    x: isCut.value ? component.x : component.x + 20,
    y: isCut.value ? component.y : component.y + 20,
    props: JSON.parse(JSON.stringify(component.props || {})),
    api: component.api ? JSON.parse(JSON.stringify(component.api)) : null,
    dataTransform: component.dataTransform ? JSON.parse(JSON.stringify(component.dataTransform)) : undefined,
    events: component.events ? JSON.parse(JSON.stringify(component.events)) : undefined
  }))

  // 如果是剪切操作，清空剪切标记（组件已在剪切时删除）
  if (isCut.value) {
    isCut.value = false
  }

  // 添加到 store
  const addedComponents = panelStore.batchAddComponents(pastedComponents, {
    description: pastedComponents.length > 1 ? `粘贴组件 (${pastedComponents.length} 个)` : `粘贴组件: ${pastedComponents[0].name}`
  })

  setSelectedIds(addedComponents.map(component => component.id))

  ElMessage.success(pastedComponents.length > 1 ? `已粘贴 ${pastedComponents.length} 个组件` : '组件已粘贴')
}

// 快速复制组件 (Ctrl+D)
const duplicateSelectedComponents = () => {
  const selection = selectedComponents.value.filter(component => component.type !== 'PlaceholderBrick')
  if (selection.length === 0) return

  // 防止复制出多个导航菜单组件
  if (selection.some(component => component.type === 'MenuBrick' || component.type === 'HeaderMenuBrick')) {
    ElMessageBox.alert('一个项目只能配置一个导航菜单组件', '提示', {
      type: 'warning',
      confirmButtonText: '知道了'
    })
    return
  }

  const duplicatedComponents = selection.map((component, index) => ({
    ...component,
    id: Date.now() + Math.random() + index,
    x: component.x + 20,
    y: component.y + 20,
    props: JSON.parse(JSON.stringify(component.props || {})),
    api: component.api ? JSON.parse(JSON.stringify(component.api)) : null,
    dataTransform: component.dataTransform ? JSON.parse(JSON.stringify(component.dataTransform)) : undefined,
    events: component.events ? JSON.parse(JSON.stringify(component.events)) : undefined
  }))

  const addedComponents = panelStore.batchAddComponents(duplicatedComponents, {
    description: duplicatedComponents.length > 1 ? `复制组件 (${duplicatedComponents.length} 个)` : `复制组件: ${duplicatedComponents[0].name}`
  })
  setSelectedIds(addedComponents.map(component => component.id))

  ElMessage.success(duplicatedComponents.length > 1 ? `已复制 ${duplicatedComponents.length} 个组件` : '组件已复制')
}

const duplicateComponent = (id) => {
  setSelectedIds([id])
  duplicateSelectedComponents()
}

const removeSelectedComponents = async () => {
  const ids = [...activeSelectionIds.value]
  if (ids.length === 0) return

  try {
    if (ids.length > 1) {
      await ElMessageBox.confirm(
        `移除已选的 ${ids.length} 个组件？`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
      const removedCount = panelStore.batchRemoveComponents(ids)
      clearSelection()
      if (removedCount > 0) ElMessage.success(`已删除 ${removedCount} 个组件`)
      return
    }

    await removeComponent(ids[0])
    clearSelection()
  } catch {
    // 用户取消删除
  }
}

// 保存为业务组件
const saveAsBusinessComponent = async (id) => {
  const component = components.value.find(c => c.id === id)
  if (!component) return

  try {
    // 根据组件类型获取标题作为默认名称
    let defaultName = component.name

    // 优先使用组件的 title 或 text 属性
    if (component.props.title) {
      defaultName = component.props.title
    } else if (component.props.text) {
      defaultName = component.props.text
    }

    // 弹出输入框让用户输入业务组件名称
    const { value: componentName } = await ElMessageBox.prompt(
      '请输入业务组件名称',
      '保存为业务组件',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '组件名称不能为空',
        inputValue: defaultName
      }
    )

    if (componentName) {
      // 获取组件对应的图标（从 brickLibrary 中查找）
      const brickInfo = brickLibrary.find(b => b.type === component.type)

      businessComponentStore.addBusinessComponent({
        name: componentName.trim(),
        type: component.type,
        icon: brickInfo?.icon || 'bi-box-seam',
        width: component.width,
        height: component.height,
        props: component.props,
        api: component.api
      })
      ElMessage({
        message: `业务组件"${componentName}"已保存`,
        type: 'success',
        duration: 2000
      })
    }
  } catch {
    // 用户取消操作
  }
}

const removeComponent = async (id) => {
  try {
    await ElMessageBox.confirm(
      '移除此组件？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    panelStore.removeComponent(id)
    ElMessage({
      type: 'success',
      message: '删除成功',
    })
  } catch {
    // 用户取消删除
  }
}

// 设置为底图
const setAsBaseMap = (id) => {
  const component = panelStore.components.find(c => c.id === id)
  if (!component) return

  // 设置为全屏
  component.x = 0
  component.y = 0
  component.width = designWidth.value
  component.height = designHeight.value
  component.zIndex = 0

  clearSelection()
  showDrawer.value = false

  ElMessage.success('已设置为底图')
}

const clearAll = async () => {
  if (components.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      '此操作将清空所有组件，是否继续？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    panelStore.clearComponents()
    clearSelection()
    showDrawer.value = false
    ElMessage({
      type: 'success',
      message: '已清空画布',
    })
  } catch {
    // 用户取消清空
  }
}

// 计算并应用缩放
const calculateScale = () => {
  if (!canvasWrapperRef.value) return

  const wrapper = canvasWrapperRef.value

  // 根据屏幕分辨率动态调整边距
  // 4K 显示器通常宽度 >= 3840px，2K 为 2560px
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  const is4K = screenWidth >= 3840
  const is2K = screenWidth >= 2560 && screenWidth < 3840

  // 动态计算边距和最大缩放比例
  let horizontalMargin, verticalMargin, maxScale

  if (is4K) {
    // 4K 显示器使用极小的边距，让画布尽可能大
    horizontalMargin = 40  // 左右边距总和
    verticalMargin = 40    // 上下边距总和
    maxScale = 1.8         // 允许放大到 1.8 倍
  } else if (is2K) {
    // 2K 显示器使用中等边距
    horizontalMargin = 100
    verticalMargin = 60
    maxScale = 1.3         // 允许放大到 1.3 倍
  } else {
    // 1080p 及以下使用较大边距
    horizontalMargin = 200
    verticalMargin = 120
    maxScale = 1           // 最大 1 倍，不放大
  }

  // 可用区域 = 容器尺寸 - 刻度尺宽度 - 内边距
  const availableWidth = wrapper.clientWidth - 30 - horizontalMargin
  const availableHeight = wrapper.clientHeight - 30 - verticalMargin

  const canvasWidth = designWidth.value
  const canvasHeight = designHeight.value

  // 计算宽度和高度的缩放比例，取较小的那个以确保完整显示且保持 16:9 比例
  const scaleX = availableWidth / canvasWidth
  const scaleY = availableHeight / canvasHeight
  const scale = Math.min(scaleX, scaleY, maxScale) // 使用动态的最大缩放限制

  canvasScale.value = scale


  if (moveableInstance.value) {
    moveableInstance.value.zoom = actualCanvasScale.value
    moveableInstance.value.updateTarget()
  }
}

const setCanvasScale = (scale) => {
  canvasScale.value = Math.max(0.08, Math.min(scale, 2.48))
  if (moveableInstance.value) {
    moveableInstance.value.zoom = actualCanvasScale.value
    moveableInstance.value.updateTarget()
  }
}

const zoomIn = () => {
  setCanvasScale(canvasScale.value + 0.1)
}

const zoomOut = () => {
  setCanvasScale(canvasScale.value - 0.1)
}

const resetZoom = () => {
  setCanvasScale(0.98)
}

const fitCanvas = () => {
  calculateScale()
}

// 生命周期：添加键盘事件监听
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', calculateScale)

  // 初次计算缩放
  setTimeout(() => {
    calculateScale()
  }, 100)

  // 初始化 Moveable 实例
  if (canvasRef.value && !props.readonly) {
    moveableInstance.value = new Moveable(canvasRef.value, {
      target: null,
      draggable: false,
      resizable: true,
      rotatable: false,
      throttleDrag: 0,
      throttleResize: 0,
      throttleRotate: 0,
      keepRatio: false,
      zoom: actualCanvasScale.value,
      edge: false,
      rotationPosition: "none",
      renderDirections: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
    })

    // 绑定事件
    moveableInstance.value.on('drag', onMoveDrag)
    moveableInstance.value.on('dragEnd', onMoveEnd)
    moveableInstance.value.on('resizeStart', onMoveResizeStart)
    moveableInstance.value.on('resize', onMoveResize)
    moveableInstance.value.on('resizeEnd', onMoveEnd)
    moveableInstance.value.on('rotate', onMoveRotate)
    moveableInstance.value.on('rotateEnd', onMoveEnd)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', calculateScale)
  window.removeEventListener('mousemove', handleSelectionMouseMove)
  window.removeEventListener('mouseup', handleSelectionMouseUp)
  window.removeEventListener('mousemove', onHandleMouseMove)
  window.removeEventListener('mouseup', onHandleMouseUp)

  // 清理 Moveable 实例
  if (moveableInstance.value) {
    moveableInstance.value.destroy()
    moveableInstance.value = null
  }
})


// 打开导出对话框
const openExportDialog = () => {
  if (components.value.length === 0) {
    ElMessage.warning('当前画布为空，无法导出')
    return
  }
  showExportDialog.value = true
}

// 处理导出完成
const handleExportComplete = () => {}

// 保存模板（保留用于向后兼容）
const saveTemplate = () => {
  if (panelStore.pages.every(p => p.components.length === 0)) {
    ElMessage.warning('当前画布为空，无需保存')
    return
  }

  try {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '')
    const filename = `lowcode_template_${dateStr}_${timeStr}.json`

    // 创建多页面数据对象
    const templateData = {
      version: '1.0',
      createTime: date.toISOString(),
      pages: panelStore.pages,
      projectSettings: panelStore.projectSettings,
      projectSettingsMap: panelStore.projectSettingsMap
    }

    const jsonStr = JSON.stringify(templateData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('配置已保存')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请重试')
  }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 读取模板
const loadTemplate = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result)

        // 验证数据格式（兼容旧格式和新格式）
        const hasPages = jsonData.pages && Array.isArray(jsonData.pages)
        const hasComponents = jsonData.components && Array.isArray(jsonData.components)

        if (!hasPages && !hasComponents) {
          throw new Error('无效的配置文件格式')
        }

        // 确认是否覆盖当前配置
        if (components.value.length > 0) {
          await ElMessageBox.confirm(
            '读取配置会清空当前画布，是否继续？',
            '警告',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
            }
          )
        }

        // 恢复项目设置
        if (jsonData.projectSettings) {
          panelStore.projectSettings = {
            designResolution: '1080p',
            designWidth: 1920,
            designHeight: 1080,
            ...jsonData.projectSettings
          }
        }
        if (jsonData.projectSettingsMap) {
          panelStore.projectSettingsMap = jsonData.projectSettingsMap
        }

        // 恢复多页面或单页面
        if (hasPages) {
          // 新格式：多页面
          panelStore.pages = jsonData.pages.map((page, i) => ({
            id: Date.now() + i,
            name: page.name || `页面 ${i + 1}`,
            components: page.components || []
          }))
          panelStore.currentPageIndex = 0
          ElMessage.success(`成功读取 ${jsonData.pages.length} 个页面`)
        } else {
          // 旧格式：单页面
          panelStore.clearComponents()
          jsonData.components.forEach(comp => {
            panelStore.addComponent(comp)
          })
          ElMessage.success(`成功读取 ${jsonData.components.length} 个组件`)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('读取失败:', error)
          ElMessage.error(error.message || '配置文件格式错误')
        }
      }
    }

    reader.readAsText(file)
  } catch (error) {
    console.error('读取失败:', error)
    ElMessage.error('读取失败，请重试')
  } finally {
    // 清空 input，允许重复选择同一个文件
    event.target.value = ''
  }
}

// 发布模板
const publishTemplate = async () => {
  if (components.value.length === 0) {
    ElMessage.warning('当前画布为空，无法发布')
    return
  }

  try {
    // 生成唯一的 hash 值
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const hashValue = `${timestamp}_${random}`

    // 创建模板数据
    const templateData = {
      hashValue,
      template: {
        version: '1.0',
        createTime: new Date().toISOString(),
        pages: panelStore.pages,
        projectSettings: panelStore.projectSettings,
        projectSettingsMap: panelStore.projectSettingsMap
      }
    }

    // 提示用户确认
    await ElMessageBox.confirm(
      '确认要发布当前模板吗？',
      '发布模板',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    )

    // 输入暗号验证
    const { value: secretCode } = await ElMessageBox.prompt(
      '请输入发布暗号以继续：',
      '暗号验证',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入暗号',
        inputPattern: /.+/,
        inputErrorMessage: '暗号不能为空'
      }
    )

    // 验证暗号
    if (secretCode !== 'nicopublish') {
      ElMessage.error('暗号错误，发布取消')
      return
    }

    // 调用 API 发布
    const loading = ElMessage({
      message: '正在发布模板...',
      type: 'info',
      duration: 0,
      icon: 'el-icon-loading'
    })

    await api.postTemplate(templateData)

    loading.close()

    // 生成分享链接
    const shareUrl = `${window.location.origin}/#/hash/${hashValue}`

    // 显示成功消息和分享链接
    await ElMessageBox.alert(
      `<div style="word-break: break-all;">
        <p>模板发布成功！</p>
        <p style="margin-top: 10px; font-weight: bold;">分享链接：</p>
        <p style="margin-top: 5px; color: #409eff;">${shareUrl}</p>
        <p style="margin-top: 10px; font-size: 12px; color: #909399;">您可以复制此链接分享给他人</p>
      </div>`,
      '发布成功',
      {
        confirmButtonText: '复制链接',
        dangerouslyUseHTMLString: true,
        callback: () => {
          // 复制链接到剪贴板
          navigator.clipboard.writeText(shareUrl).then(() => {
            ElMessage.success('链接已复制到剪贴板')
          }).catch(() => {
            ElMessage.warning('复制失败，请手动复制链接')
          })
        }
      }
    )
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布失败:', error)
      ElMessage.error(error.message || '发布失败，请重试')
    }
  }
}

const waitForRenderFrame = () => new Promise(resolve => {
  requestAnimationFrame(() => requestAnimationFrame(resolve))
})

const captureCanvasFrames = (element) => {
  return Array.from(element.querySelectorAll('canvas')).map(canvas => {
    try {
      return {
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.offsetWidth,
        height: canvas.offsetHeight
      }
    } catch {
      return null
    }
  })
}

const captureCoverImage = async () => {
  if (!canvasRef.value) throw new Error('无法获取当前画布')

  const settings = panelStore.projectSettings || {}
  const backgroundImage = settings.backgroundImage
  await waitForRenderFrame()
  const canvasFrames = captureCanvasFrames(canvasRef.value)

  return exportToImage(canvasRef.value, {
    format: 'jpg',
    quality: 0.88,
    scale: 0.5,
    backgroundColor: settings.backgroundColor || null,
    allowTaint: false,
    ignoreElements: element => [
      'component-actions',
      'alignment-guide',
      'selection-box',
      'empty-state'
    ].some(className => element.classList?.contains(className)),
    onclone: clonedDocument => {
      const clonedCanvas = clonedDocument.querySelector('[data-cover-canvas]')
      if (!clonedCanvas) return

      clonedCanvas.style.transform = 'none'
      clonedCanvas.style.backgroundImage = backgroundImage ? `url(${backgroundImage})` : 'none'
      clonedCanvas.style.backgroundSize = backgroundImage ? '100% 100%' : ''
      clonedCanvas.querySelectorAll('.selected-component, .multi-selected-component').forEach(element => {
        element.classList.remove('selected-component', 'multi-selected-component')
      })
      clonedCanvas.querySelectorAll('canvas').forEach((canvas, index) => {
        const frame = canvasFrames[index]
        if (!frame?.dataUrl) return

        const image = clonedDocument.createElement('img')
        image.src = frame.dataUrl
        image.className = canvas.className
        image.style.cssText = canvas.style.cssText
        image.style.width = `${frame.width}px`
        image.style.height = `${frame.height}px`
        image.style.display = 'block'
        canvas.replaceWith(image)
      })
    }
  })
}

// 暴露方法和状态供父组件调用
defineExpose({
  saveTemplate,
  openExportDialog,
  triggerFileInput,
  publishTemplate,
  clearAll,
  selectComponent,
  selectedComponentId,
  selectedComponentIds,
  zoomIn,
  zoomOut,
  resetZoom,
  fitCanvas,
  canvasScalePercent,
  captureCoverImage
})
</script>

<style scoped>
.canvas-panel {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--lc-bg-page);
}



/* 刻度尺样式 */
.ruler {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  position: absolute;
  z-index: 100;
}

.ruler-horizontal {
  top: 0;
  left: 30px;
  right: 0;
  height: 30px;
  overflow: hidden;
}

.ruler-vertical {
  top: 30px;
  left: 0;
  bottom: 0;
  width: 30px;
  overflow: hidden;
}

.ruler-corner {
  position: absolute;
  top: 0;
  left: 0;
  width: 30px;
  height: 30px;
  background: var(--color-bg-tertiary);
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  z-index: 101;
}

.ruler-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.ruler-mark {
  position: absolute;
}

.ruler-horizontal .ruler-mark {
  height: 100%;
  border-left: 1px solid #d0d0d0;
}

.ruler-horizontal .ruler-label {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 10px;
  color: #666;
  user-select: none;
}

.ruler-vertical .ruler-mark {
  width: 100%;
  border-top: 1px solid #d0d0d0;
}

.ruler-vertical .ruler-label {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 10px;
  color: #666;
  writing-mode: vertical-lr;
  user-select: none;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 不可滚动画布区域 */
.canvas-noscroll {
  background: var(--lc-bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  overflow: hidden;
}

.canvas-content {
  width: 1920px;
  height: 1080px;
  min-width: 1920px;
  min-height: 1080px;
  transform-origin: center center;
  position: relative;
  /* 抽取网格变量给内联 JS 使用 */
  --grid-pattern: linear-gradient(90deg, var(--color-border-light) 1px, transparent 1px),
    linear-gradient(var(--color-border-light) 1px, transparent 1px);
  background-color: var(--lc-bg-panel);
  box-shadow: var(--lc-shadow-lg);
  overflow: hidden;
  /* 防止子元素溢出 */
  transition: background 0.3s ease;
}


.canvas-item {
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  transition: border-color 0.3s ease;
  background: var(--lc-bg-panel);
  box-sizing: border-box;
  /* 纭繚border鍖呭惈鍦ㄥ楂樺唴 */
}

.canvas-item:hover {
  border-color: var(--lc-brand-500);
  cursor: pointer;
}

.canvas-item.active {
  border-color: var(--lc-brand-600);
  box-shadow: 0 4px 16px var(--lc-focus-ring);
}

/* 组件操作按钮组 */
.component-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  z-index: 100;
}

/* 齿轮设置按钮 */
.component-settings-trigger {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8);
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  pointer-events: none;
}

/* 底图按钮 */
.component-basemap-trigger {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #409EFF 0%, #3a8ee6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8);
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
  pointer-events: none;
}

/* 垃圾桶删除按钮 */
.component-delete-trigger {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #f56c6c 0%, #e74c3c 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8);
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.4);
  pointer-events: none;
}

/* 拖动手柄按钮 */
.component-drag-handle {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #e6a23c 0%, #f39c12 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: grab;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8);
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.4);
  pointer-events: none;
}

.component-drag-handle:active {
  cursor: grabbing;
}

.canvas-item:hover .component-settings-trigger,
.canvas-item:hover .component-delete-trigger,
.canvas-item:hover .component-drag-handle,
.canvas-item:hover .component-basemap-trigger {
  opacity: 1;
  visibility: visible;
  transform: scale(1);
  pointer-events: auto;
}

.component-settings-trigger:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
}

.component-settings-trigger:active {
  transform: scale(0.95) rotate(90deg);
}

.component-delete-trigger:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.6);
}

.component-delete-trigger:active {
  transform: scale(0.95);
}

.component-drag-handle:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.6);
}

.settings-tooltip,
.delete-tooltip,
.drag-tooltip {
  position: absolute;
  top: 50%;
  right: 45px;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.component-settings-trigger:hover .settings-tooltip,
.component-delete-trigger:hover .delete-tooltip,
.component-drag-handle:hover .drag-tooltip {
  opacity: 1;
}

.brick-wrapper {
  width: 100%;
  height: 100%;
}

.alignment-guide {
  position: absolute;
  z-index: 9999;
  pointer-events: none;
  background: var(--lc-brand-500);
  box-shadow: 0 0 0 1px var(--lc-focus-ring);
}

.alignment-guide-vertical {
  top: 0;
  width: 1px;
  height: 100%;
}

.alignment-guide-horizontal {
  left: 0;
  width: 100%;
  height: 1px;
}

.selection-box {
  position: absolute;
  z-index: 9998;
  pointer-events: none;
  border: 1px solid var(--lc-brand-500);
  background: color-mix(in srgb, var(--lc-brand-500) 12%, transparent);
  box-shadow: inset 0 0 0 1px var(--lc-focus-ring);
}

.selected-component {
  outline: 3px solid var(--lc-brand-500);
  outline-offset: -3px;
  z-index: 1000;
  box-shadow: 0 0 0 3px var(--lc-focus-ring);
}

.multi-selected-component {
  outline: 2px dashed var(--lc-brand-500);
  outline-offset: -2px;
  box-shadow: inset 0 0 0 9999px color-mix(in srgb, var(--lc-brand-500) 6%, transparent);
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(460px, 80%);
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-xl);
  background: color-mix(in srgb, var(--lc-bg-panel) 92%, transparent);
  box-shadow: var(--lc-shadow-md);
  backdrop-filter: blur(8px);
  transform: translate(-50%, -50%);
}

/* 只读模式样式 */
.readonly-item {
  cursor: default !important;
}

.readonly-item:hover {
  border-color: transparent !important;
}

.readonly-item .selected-component {
  outline: none !important;
}

/* 业务组件样式 */
.business-component {
  border-color: var(--color-border) !important;
  border-width: 2px;
}

.business-component:hover {
  border-color: #85ce61 !important;
  box-shadow: 0 2px 12px rgba(103, 194, 58, 0.3);
}

/* PlaceholderBrick 样式 - 完全禁用交互 */
.placeholder-item {
  cursor: default !important;
  border: none !important;
  background: transparent !important;
  pointer-events: none !important;
}

.placeholder-item:hover {
  border-color: transparent !important;
  box-shadow: none !important;
  cursor: default !important;
}

.placeholder-item.selected-component {
  outline: none !important;
  box-shadow: none !important;
}

/* 允许 PlaceholderBrick 内部的内容接收事件，但不响应 */
.placeholder-item .brick-wrapper {
  pointer-events: auto !important;
}
</style>
