<template>
  <div class="sidebar">
    <el-tabs v-model="activeTab" class="sidebar-tabs" tab-position="left">
      <!-- 组件库选项卡 -->
      <el-tab-pane name="components">
        <template #label>
          <div class="tab-label">
            <el-icon>
              <Grid />
            </el-icon>
            <span>组件</span>
          </div>
        </template>
        <div class="tab-content no-padding">
          <div class="component-workspace">
            <div class="component-library-section">
              <div class="component-section-header">
                <div>
                  <span>基础组件</span>
                  <small>导航、交互与通用操作组件</small>
                </div>
                <el-tag size="small" effect="plain">通用</el-tag>
              </div>
              <div class="component-library-shell">
                <ComponentLibrary />
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 图表组件选项卡 -->
      <el-tab-pane name="charts">
        <template #label>
          <div class="tab-label">
            <el-icon>
              <TrendCharts />
            </el-icon>
            <span>图表</span>
          </div>
        </template>
        <div class="tab-content no-padding">
          <div class="chart-workspace">
            <div class="business-section">
              <div class="business-section-header">
                <div>
                  <span>图表组件</span>
                  <small>图表、指标、表格、视频按用途归类</small>
                </div>
                <el-tag size="small" type="info">{{ businessComponents.length }}</el-tag>
              </div>

              <el-empty v-if="businessComponents.length === 0" description="暂无图表组件" :image-size="48">
                <template #image>
                  <el-icon :size="48">
                    <FolderAdd />
                  </el-icon>
                </template>
              </el-empty>

              <!-- 按分类分组显示 -->
              <el-collapse v-else v-model="activeCategories" class="category-collapse">
                <el-collapse-item v-for="section in groupedBusinessComponentSections" :key="section.value"
                  :name="section.value">
                  <template #title>
                    <div class="category-header">
                      <el-icon>
                        <FolderOpened />
                      </el-icon>
                      <div class="category-title">
                        <strong>{{ section.label }}</strong>
                        <small>{{ section.description }}</small>
                      </div>
                      <el-tag size="small" type="info">{{ section.components.length }}</el-tag>
                    </div>
                  </template>

                  <div class="business-list">
                    <el-card v-for="comp in section.components" :key="`${comp.category}-${comp.name}`" class="business-item"
                      shadow="hover" draggable="true" @dragstart="handleBusinessDragStart($event, comp)">
                      <div class="business-content">
                        <i :class="['brick-icon', comp.icon]"></i>
                        <div class="business-info">
                          <div class="business-name-row">
                            <div class="business-name">{{ comp.name }}</div>
                            <el-tag size="small" effect="plain">{{ comp.category }}</el-tag>
                          </div>
                          <div class="business-desc">{{ comp.defaultWidth }} × {{ comp.defaultHeight }} · {{ comp.type }}</div>
                        </div>
                      </div>
                    </el-card>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 模板选项卡 -->
      <el-tab-pane name="layouts">
        <template #label>
          <div class="tab-label">
            <el-icon>
              <Files />
            </el-icon>
            <span>模板</span>
          </div>
        </template>
        <div class="tab-content">
          <el-collapse v-model="activeLayoutCategories" class="category-collapse">
            <!-- 大屏项目模板 -->
            <!-- <el-collapse-item name="大屏项目模板">
              <template #title>
                <div class="category-header">
                  <el-icon>
                    <FolderOpened />
                  </el-icon>
                  <span>大屏项目模板</span>
                  <el-tag size="small" type="info">{{ projectTpls.length }}</el-tag>
                </div>
              </template>
              <div class="layouts-list">
                <el-card v-for="tpl in projectTpls" :key="tpl.id" class="layout-card project-card" shadow="hover"
                  @click="applyProjectTpl(tpl)">
                  <div class="layout-content">
                    <span class="project-icon">{{ tpl.thumbnail }}</span>
                    <div class="layout-info">
                      <div class="layout-name">{{ tpl.name }}</div>
                      <div class="layout-desc">{{ tpl.description }}</div>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-collapse-item> -->

            <!-- 分组的页面布局模板 -->
            <el-collapse-item v-for="cat in layoutTemplates" :key="cat.category" :name="cat.category">
              <template #title>
                <div class="category-header">
                  <el-icon>
                    <FolderOpened />
                  </el-icon>
                  <span>{{ cat.category }}</span>
                  <el-tag size="small" type="info">{{ cat.templates.length }}</el-tag>
                </div>
              </template>
              <div class="layouts-list">
                <el-card v-for="template in cat.templates" :key="template.id" class="layout-card" shadow="hover"
                  draggable="true" @dragstart="handleLayoutDragStart($event, template)">
                  <div class="layout-content">
                    <LayoutIcon :layout="template.layout" :size="48" />
                    <div class="layout-info">
                      <div class="layout-name">{{ template.name }}</div>
                      <div class="layout-desc">{{ template.description }}</div>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-tab-pane>


      <!-- 交互选项卡 -->
      <el-tab-pane name="visual">
        <template #label>
          <div class="tab-label">
            <el-icon>
              <Connection />
            </el-icon>
            <span>交互</span>
          </div>
        </template>
        <div class="tab-content no-padding">
          <VisualPanel />
        </div>
      </el-tab-pane>


      <!-- 图层管理选项卡 -->
      <el-tab-pane name="layers">
        <template #label>
          <div class="tab-label">
            <el-icon>
              <Operation />
            </el-icon>
            <span>图层</span>
          </div>
        </template>
        <div class="tab-content no-padding">
          <LayerPanel :selected-id="selectedComponentId" @select="handleSelectLayer" />
        </div>
      </el-tab-pane>
      <!-- 数据转换选项卡 -->
      <!-- <el-tab-pane label="数据转换" name="transforms">
        <div class="tab-content no-padding">
          <DataTransformPanel />
        </div>
      </el-tab-pane> -->

      <!-- 设置选项卡 -->
      <el-tab-pane name="settings">
        <template #label>
          <div class="tab-label">
            <el-icon>
              <Setting />
            </el-icon>
            <span>设置</span>
          </div>
        </template>
        <div class="tab-content no-padding">
          <ProjectSettingsPanel />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-tooltip content="返回工作区" placement="right" :show-after="300">
      <button class="workspace-entry" aria-label="返回工作区" type="button" @click="goWorkspace">
        <el-icon>
          <Back />
        </el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  FolderAdd,
  FolderOpened,
  Grid,
  Files,
  Connection,
  Operation,
  Setting,
  Back,
  TrendCharts
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ComponentLibrary from './ComponentLibrary.vue'
import LayoutIcon from './LayoutIcon.vue'
import LayerPanel from './LayerPanel.vue'
import VisualPanel from './VisualPanel.vue'
import ProjectSettingsPanel from './ProjectSettingsPanel.vue'
import { useBusinessComponentStore } from '../stores/businessComponentStore'
import { usePanelStore } from '../stores/panelStore'
import { getLayoutTemplates, getProjectTemplates } from '../config/layoutTemplates'

// Props
const props = defineProps({
  componentCount: {
    type: Number,
    default: 0
  },
  selectedComponentId: {
    type: [Number, String],
    default: null
  }
})

// Emits
const emit = defineEmits(['select-layer'])

const businessComponentStore = useBusinessComponentStore()
const panelStore = usePanelStore()
const router = useRouter()

const activeTab = ref('components')

// 布局模板
const layoutTemplates = getLayoutTemplates()
const projectTpls = getProjectTemplates()
const activeLayoutCategories = ref([])

// 处理图层选择
const handleSelectLayer = (id) => {
  emit('select-layer', id)
}

// 图表组件列表
import { chartTypeComponents } from '../business/chartTypes'

const businessComponents = computed(() => [...chartTypeComponents])

const businessGroupDefs = [
  {
    value: 'charts',
    label: '图表可视化',
    description: '柱状、折线、饼图、雷达等',
    matcher: comp => ['柱状图', '饼图', '折线图', '雷达图', '漏斗图', '地图'].includes(comp.category)
      || /Chart|Bar|Line|Pie|Radar|Funnel|Map|Ring/.test(comp.type)
  },
  {
    value: 'metrics',
    label: '指标卡片',
    description: '数值、仪表盘、水滴等 KPI',
    matcher: comp => comp.category === '指标' || /Stat|Gauge|WaterDrop/.test(comp.type)
  },
  {
    value: 'data-display',
    label: '数据展示',
    description: '表格与结构化数据呈现',
    matcher: comp => comp.category === '表格' || /Table/.test(comp.type)
  },
  {
    value: 'media',
    label: '视频媒体',
    description: '实时视频与流媒体组件',
    matcher: comp => comp.category === '视频' || /Video|HLS|FLV/.test(comp.type)
  },
  {
    value: 'other',
    label: '其他业务',
    description: '未归类业务组件',
    matcher: () => true
  }
]

// 分类展开状态 - 默认展开所有分类
const activeCategories = ref([])

// 按能力域分组业务组件
const groupedBusinessComponentSections = computed(() => {
  const assigned = new Set()

  return businessGroupDefs
    .map(group => {
      const components = businessComponents.value.filter((comp) => {
        if (assigned.has(comp)) return false
        const matched = group.matcher(comp)
        if (matched) assigned.add(comp)
        return matched
      })

      return {
        ...group,
        components
      }
    })
    .filter(group => group.components.length > 0)
})

watch(groupedBusinessComponentSections, (sections) => {
  if (activeCategories.value.length === 0) {
    activeCategories.value = sections.map(section => section.value)
  }
}, { immediate: true })

// 添加业务组件到画布
// 业务组件拖拽开始
const handleBusinessDragStart = (event, comp) => {
  const defaultProps = {
    title: comp.name,
    ...(comp.defaultProps || {})
  }

  const dragData = {
    source: 'business-component',
    type: comp.type,
    name: comp.name,
    defaultWidth: comp.defaultWidth,
    defaultHeight: comp.defaultHeight,
    defaultProps: defaultProps,
    api: comp.api || null,
    isBusinessComponent: true
  }
  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer.effectAllowed = 'copy'
}

// 布局模板拖拽开始
const handleLayoutDragStart = (event, template) => {
  const dragData = {
    source: 'layout-template',
    template: template
  }
  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer.effectAllowed = 'copy'
}

const goWorkspace = () => {
  router.push('/workspace')
}



// 应用大屏项目模板（多页面）
const applyProjectTpl = async (template) => {
  try {
    if (panelStore.components.length > 0 || panelStore.pages.length > 1) {
      await ElMessageBox.confirm(
        `应用项目模板「${template.name}」会清空所有页面，是否继续？`,
        '确认应用项目模板',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
    }
    panelStore.applyProjectTemplate(template)
    ElMessage.success(`已应用项目模板: ${template.name}（${template.pages.length}个页面）`)
  } catch { }
}

// 删除业务组件
const deleteBusinessComponent = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确认删除该业务组件？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    businessComponentStore.removeBusinessComponent(id)

    ElMessage({
      message: '业务组件已删除',
      type: 'success',
      duration: 1500
    })
  } catch {
    // 用户取消删除
  }
}
</script>

<style scoped>
.sidebar {
  width: 100%;
  height: 100%;
  background: var(--color-bg-primary);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.03);
}

.sidebar-tabs {
  height: 100%;
  display: flex;
}

.tab-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  height: 100%;
  width: 100%;
}

.tab-label .el-icon {
  font-size: 20px;
}

.tab-label span {
  text-align: center;
  width: 100%;
}

:deep(.el-tabs__item) {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

:deep(.el-tabs__item:first-child) {
  margin-top: 20px;
}

:deep(.el-tabs__header.is-left) {
  padding-bottom: 76px;
}

.workspace-entry {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 2;
  width: 48px;
  height: 48px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.workspace-entry:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.workspace-entry .el-icon {
  font-size: 22px;
}

.tab-content {
  padding: 16px;
  height: 100%;
}

.tab-content.no-padding {
  padding: 0;
}

.component-workspace {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--lc-bg-page, var(--el-bg-color-page));
}

.chart-workspace {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--lc-bg-page, var(--el-bg-color-page));
}

.component-library-section {
  flex: 1 1 58%;
  min-height: 280px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.component-section-header,
.business-section-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lc-space-2, 8px);
  padding: var(--lc-space-3, 12px);
  border-bottom: 1px solid var(--lc-border-subtle, var(--el-border-color-light));
  background: var(--lc-bg-panel, var(--el-bg-color));
}

.component-section-header > div,
.business-section-header > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.component-section-header span,
.business-section-header span {
  color: var(--lc-text-primary, var(--el-text-color-primary));
  font-size: var(--lc-font-size-body, 14px);
  font-weight: 700;
  line-height: 20px;
}

.component-section-header small,
.business-section-header small,
.category-title small {
  overflow: hidden;
  color: var(--lc-text-tertiary, var(--el-text-color-secondary));
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.component-library-shell {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.business-section {
  flex: 0 0 42%;
  min-height: 220px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  border-top: 1px solid var(--lc-border-subtle, var(--el-border-color-light));
  background: var(--lc-bg-panel, var(--el-bg-color));
}

.chart-workspace .business-section {
  flex: 1;
  min-height: 0;
  border-top: 0;
}

.business-components-info {
  text-align: center;
  padding: 40px 20px;
}

.info-text {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
  margin-top: 16px;
  padding: 0 20px;
}

.business-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 10px 10px;
}

.business-item {
  cursor: grab;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
}

.business-item:active {
  cursor: grabbing;
}

.business-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px rgba(103, 194, 58, 0.2);
}

.business-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.business-content .brick-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--lc-radius-md, 8px);
  background: var(--lc-bg-selected, var(--el-color-primary-light-9));
  color: var(--lc-brand-600, var(--el-color-primary));
  font-size: 18px;
  flex-shrink: 0;
}

.business-info {
  flex: 1;
  min-width: 0;
}

.business-name-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.business-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: var(--lc-text-primary, var(--color-text-primary));
}

.business-desc {
  overflow: hidden;
  margin-top: 2px;
  font-size: 12px;
  color: var(--lc-text-tertiary, var(--color-text-tertiary));
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.business-item .el-card__body) {
  padding: 10px;
}

/* 模板分组样式 */
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}

.project-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.project-card {
  border-left: 3px solid var(--el-color-primary);
}

/* 模板布局样式 */
.layouts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layout-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
}

.layout-card:hover {
  transform: translateY(-2px);
}

.layout-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px;
}

.layout-icon {
  flex-shrink: 0;
}

.layout-info {
  flex: 1;
  min-width: 0;
}

.layout-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.layout-desc {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

:deep(.layout-card .el-card__body) {
  padding: 12px;
}

/* 分类折叠面板样式 */
.category-collapse {
  border: none;
}

.business-section > .category-collapse {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 0 0;
}

:deep(.category-collapse .el-collapse-item__header) {
  background: var(--color-bg-tertiary);
  padding: 12px 16px;
  font-weight: 600;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

:deep(.category-collapse .el-collapse-item__header:hover) {
  background: var(--color-bg-secondary);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  font-size: 14px;
}

.category-title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-title strong {
  overflow: hidden;
  color: var(--lc-text-primary, var(--el-text-color-primary));
  font-size: 13px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-header .el-tag {
  margin-left: auto;
}

:deep(.category-collapse .el-collapse-item__wrap) {
  border: none;
}

:deep(.category-collapse .el-collapse-item__content) {
  padding: 0 0 12px 0;
}

/* 4K 显示器适配 */
@media screen and (min-width: 3840px) {

  .workspace-entry {
    left: 18px;
    bottom: 18px;
    width: 52px;
    height: 52px;
  }

  .tab-content {
    padding: 24px;
  }

  .business-content .brick-icon,
  .layout-icon {
    font-size: 40px;
  }

  .business-name,
  .layout-name {
    font-size: 18px;
  }

  .category-header {
    font-size: 16px;
  }

  .info-text,
  .business-desc,
  .layout-desc {
    font-size: 15px;
  }

  .business-content,
  .layout-content {
    gap: 18px;
  }

  .business-list {
    gap: 16px;
  }

  :deep(.business-item .el-card__body),
  :deep(.layout-card .el-card__body) {
    padding: 16px;
  }

  :deep(.category-collapse .el-collapse-item__header) {
    padding: 16px 20px;
    font-size: 16px;
  }
}

/* 2K 显示器适配 */
@media screen and (min-width: 2560px) and (max-width: 3839px) {

  .business-content .brick-icon,
  .layout-icon {
    font-size: 32px;
  }

  .business-name,
  .layout-name,
  .category-header {
    font-size: 15px;
  }

  .business-content,
  .layout-content {
    gap: 14px;
  }
}

/* 优化分隔线和边框样式 */
:deep(.el-divider) {
  margin: 16px 0;
  border-color: rgba(0, 0, 0, 0.06);
}

:deep(.el-divider__text) {
  background: var(--color-bg-primary);
  padding: 0 12px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
}

/* 卡片样式优化 */
:deep(.el-card) {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

:deep(.el-card:hover) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 折叠面板优化 */
:deep(.el-collapse-item__header) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

:deep(.el-collapse-item__wrap) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
