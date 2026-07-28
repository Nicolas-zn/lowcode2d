<template>
  <CustomDrawer v-model="visible" :title="'组件属性编辑'" :size="drawerSize" :close-on-click-modal="false" @close="handleClose">
    <template v-if="component">
      <div class="component-form">
        <div class="component-summary">
          <div class="component-summary__main">
            <span class="summary-type">{{ component.type }}</span>
            <strong>{{ component.name || formData.title || '未命名组件' }}</strong>
            <span>{{ componentMeta }}</span>
          </div>
          <el-tag v-if="hasUnsavedChanges" type="warning" effect="plain">未保存</el-tag>
          <el-tag v-else type="success" effect="plain">已同步</el-tag>
        </div>

        <section class="config-section">
          <div class="section-title">
            <el-icon>
              <Edit />
            </el-icon>
            <span>基础信息</span>
          </div>
          <div class="form-item">
            <label class="form-label">组件标题</label>
            <el-input v-model="formData.title" placeholder="请输入组件标题" clearable>
              <template #prefix>
                <el-icon>
                  <Edit />
                </el-icon>
              </template>
            </el-input>
          </div>
        </section>

        <template v-if="isEchartComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <TrendCharts />
              </el-icon>
              <span>EChart 个性化配置</span>
            </div>
            <EchartEditor :componentType="component.type" :component="component" v-model="formData.props"
              v-model:echartTheme="formData.echartTheme" v-model:colorPalette="formData.colorPalette" />
          </section>
        </template>

        <template v-if="isMapComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <TrendCharts />
              </el-icon>
              <span>地图配置</span>
            </div>
            <MapEditor v-model="formData.props" />
          </section>
        </template>

        <template v-if="isTableComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <Grid />
              </el-icon>
              <span>表格配置</span>
            </div>
            <TableEditorInline :component="component" v-model="formData.props" />
          </section>
        </template>

        <template v-if="isImgComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <Picture />
              </el-icon>
              <span>图片配置</span>
            </div>
            <ImgEditor v-model="formData.props" />
          </section>
        </template>

        <template v-if="isVideoComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <VideoPlay />
              </el-icon>
              <span>视频配置</span>
            </div>
            <VideoEditor v-model="formData.props" />
          </section>
        </template>

        <template v-if="isCesiumComponent(component.type)">
          <section class="config-section config-section--flush">
            <CesiumConfigPanel v-model="formData.props.cesiumConfig" :component="component" />
          </section>
        </template>

        <template v-if="isMenuComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <Menu />
              </el-icon>
              <span>菜单配置</span>
            </div>
            <MenuEditor :component="component" v-model="formData.props" />
          </section>
        </template>

        <template v-if="isHeaderMenuComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <Menu />
              </el-icon>
              <span>顶栏配置</span>
            </div>
            <HeaderMenuEditor :component="component" v-model="formData.props" />
          </section>
        </template>

        <template v-if="isButtonComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <Operation />
              </el-icon>
              <span>按钮配置</span>
            </div>
            <ButtonEditor v-model="formData.props" />
          </section>
        </template>

        <template v-if="!isButtonComponent(component.type) && !isCesiumComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <Connection />
              </el-icon>
              <span>数据绑定</span>
            </div>

            <div class="request-summary">
              <div>
                <strong>{{ requestSummary.title }}</strong>
                <span>{{ requestSummary.description }}</span>
              </div>
              <div class="request-actions">
                <el-button :icon="DocumentCopy" @click="openExampleDataDialog">返回示例</el-button>
                <el-button type="primary" :icon="Connection" @click="showRequestDialog = true">配置接口</el-button>
              </div>
            </div>
          </section>
        </template>

        <template v-if="isButtonComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <Operation />
              </el-icon>
              <span>交互事件</span>
            </div>
            <ButtonEventEditor v-model="formData.events" />
          </section>
        </template>
        <template v-else-if="!isCesiumComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <Operation />
              </el-icon>
              <span>交互事件</span>
            </div>
            <EventConfigPanel v-model="formData.events" />
          </section>
        </template>

        <template v-if="!isButtonComponent(component.type) && !isCesiumComponent(component.type)">
          <section class="config-section">
            <div class="section-title">
              <el-icon>
                <View />
              </el-icon>
              <span>条件显示</span>
            </div>
            <div class="form-item">
              <label class="form-label">显示条件</label>
              <el-input v-model="formData.visibilityCondition" placeholder="例如: selectedCity === 'Beijing'" clearable>
                <template #prepend>=</template>
              </el-input>
              <div class="hint-text">输入 JavaScript 表达式，返回 true 时显示组件</div>
            </div>
          </section>
        </template>

        <section v-if="!isCesiumComponent(component.type)" class="config-section">
          <div class="section-title">
            <el-icon>
              <Operation />
            </el-icon>
            <span>快捷操作</span>
          </div>
          <div class="quick-actions">
            <el-button type="success" :icon="FolderAdd" @click="handleSaveAsBusinessComponent"
              v-if="!component.isBusinessComponent">
              保存为业务组件
            </el-button>
          </div>
        </section>
      </div>
    </template>
    <AppEmpty v-else title="请选择组件" description="在画布中选择一个组件后，可在这里编辑属性、数据和交互。" />

    <template #footer v-if="component">
      <span class="footer-status" :class="{ dirty: hasUnsavedChanges }">
        {{ hasUnsavedChanges ? '有未保存的更改' : '配置已同步' }}
      </span>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        <el-icon><Select /></el-icon>
        <span>保存修改</span>
      </el-button>
    </template>
  </CustomDrawer>

  <RequestConfigDialog
    v-model="showRequestDialog"
    :component-name="formData.title || formData.name"
    :api-config="formData.api"
    :data-source-id="formData.dataSourceId"
    :data-transform="formData.dataTransform"
    @confirm="handleRequestConfirm"
  />

  <el-dialog
    v-model="showExampleDataDialog"
    title="返回示例数据"
    width="760px"
    :close-on-click-modal="false"
  >
    <div class="example-data-dialog">
      <div class="example-data-meta">
        <strong>{{ exampleDataTitle }}</strong>
        <span>{{ exampleDataDescription }}</span>
      </div>
      <pre class="example-data-code">{{ exampleDataText }}</pre>
    </div>
    <template #footer>
      <el-button @click="showExampleDataDialog = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, watch, ref, reactive, nextTick } from 'vue'
import {
  Edit,
  Connection,
  FolderAdd,
  Operation,
  Select,
  TrendCharts,
  Grid,
  View,
  Picture,
  VideoPlay,
  DocumentCopy
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePanelStore } from '../stores/panelStore'
import { useDataSourceStore } from '../stores/dataSourceStore'
import CustomDrawer from './CustomDrawer.vue'
import EchartEditor from './EchartEditor.vue'
import TableEditorInline from './TableEditorInline.vue'
import EventConfigPanel from './EventConfigPanel.vue'
import ButtonEventEditor from './ButtonEventEditor.vue'
import ImgEditor from './ImgEditor.vue'
import CesiumConfigPanel from './CesiumConfigPanel.vue'
import MenuEditor from './MenuEditor.vue'
import HeaderMenuEditor from './HeaderMenuEditor.vue'
import ButtonEditor from './ButtonEditor.vue'
import VideoEditor from './VideoEditor.vue'
import MapEditor from './MapEditor.vue'
import RequestConfigDialog from './RequestConfigDialog.vue'
import AppEmpty from './common/AppEmpty.vue'
import { describeDataSourceRequest, hasLegacyApiRequestConfig } from '../utils/requester'

const panelStore = usePanelStore()
const dataSourceStore = useDataSourceStore()

const drawerSize = computed(() => {
  const screenWidth = window.screen.width
  if (screenWidth >= 3840) return '650px'
  if (screenWidth >= 2560) return '500px'
  return '450px'
})

const isEchartComponent = (type) => [
  'EChartBrick',
  'LineChartBrick',
  'PieChartBrick',
  'RadarBrick',
  'HorizontalBarBrick',
  'FunnelBrick',
  'RingBarBrick'
].includes(type)

const isMapComponent = (type) => type === 'EChartMapBrick'
const isTableComponent = (type) => type === 'TableBrick'
const isImgComponent = (type) => type === 'ImgBrick'
const isVideoComponent = (type) => ['HLSVideoBrick', 'FLVVideoBrick'].includes(type)
const isCesiumComponent = (type) => type === 'CesiumBrick'
const isMenuComponent = (type) => type === 'MenuBrick'
const isHeaderMenuComponent = (type) => type === 'HeaderMenuBrick'
const isButtonComponent = (type) => type === 'ButtonBrick'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  component: { type: Object, default: null },
  copiedSize: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'duplicate', 'save-as-business', 'delete'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const saving = ref(false)
const dataSourceMode = ref('http')
const showRequestDialog = ref(false)
const showExampleDataDialog = ref(false)

const lastComponentId = ref(null)

const exampleDataMap = {
  TableBrick: {
    columns: ['名称', '状态', '更新时间'],
    rows: [
      { 名称: '订单中心', 状态: '正常', 更新时间: '2026-06-26 09:30:00' },
      { 名称: '告警中心', 状态: '异常', 更新时间: '2026-06-26 09:35:00' }
    ]
  },
  EChartBrick: {
    xAxis: ['周一', '周二', '周三', '周四', '周五'],
    series: [
      {
        name: '访问量',
        data: [120, 180, 150, 220, 260],
        color: '#5470c6'
      }
    ]
  },
  LineChartBrick: {
    xAxis: ['1月', '2月', '3月', '4月', '5月', '6月'],
    series: [
      {
        name: '增长率',
        data: [820, 932, 901, 934, 1290, 1330],
        color: '#67C23A'
      }
    ]
  },
  HorizontalBarBrick: {
    yAxis: ['北京', '上海', '广州', '深圳'],
    series: [
      {
        name: '销售额',
        data: [320, 280, 250, 400],
        color: '#409EFF'
      }
    ]
  },
  PieChartBrick: [
    { value: 335, name: 'A类' },
    { value: 310, name: 'B类' },
    { value: 234, name: 'C类' }
  ],
  RingBarBrick: [
    { value: 58, name: '已完成' },
    { value: 42, name: '进行中' }
  ],
  RadarBrick: {
    indicator: [
      { name: '性能', max: 100 },
      { name: '稳定性', max: 100 },
      { name: '安全性', max: 100 }
    ],
    series: [
      {
        name: '综合评分',
        value: [85, 92, 78]
      }
    ]
  },
  FunnelBrick: [
    { value: 1000, name: '访问' },
    { value: 720, name: '转化' },
    { value: 420, name: '成交' }
  ],
  GaugeBrick: {
    value: 75
  },
  EChartMapBrick: {
    regions: [
      { name: '北京', value: 120 },
      { name: '上海', value: 95 },
      { name: '深圳', value: 110 }
    ],
    tooltip: '区域热力数据'
  },
  ImgBrick: {
    url: 'https://example.com/demo-image.png',
    alt: '示例图片'
  },
  HLSVideoBrick: {
    url: 'https://example.com/demo.m3u8',
    poster: 'https://example.com/demo-poster.jpg',
    title: '示例视频'
  },
  FLVVideoBrick: {
    url: 'https://example.com/demo.flv',
    poster: 'https://example.com/demo-poster.jpg',
    title: '示例视频'
  },
  MenuBrick: {
    items: [
      { label: '首页', key: 'home' },
      { label: '报表', key: 'report' },
      { label: '设置', key: 'settings' }
    ]
  },
  HeaderMenuBrick: {
    items: [
      { label: '工作台', key: 'workspace' },
      { label: '通知', key: 'notice' },
      { label: '个人中心', key: 'profile' }
    ]
  },
  CesiumBrick: {
    layers: [
      { id: 'layer-1', name: '示例图层', visible: true }
    ],
    entities: [
      { id: 'entity-1', name: '监测点', position: [116.39, 39.9, 120] }
    ]
  }
}

const requestSummary = computed(() => {
  const dataSource = dataSourceStore.dataSources.find(ds => ds.id === formData.dataSourceId)
  if (dataSource) {
    const requester = dataSourceStore.getRequester(dataSource.requesterId)
    return describeDataSourceRequest({ dataSource, requester })
  }

  if (formData.api?.suffix) {
    return {
      title: '旧版接口配置',
      description: `${formData.api.method || 'GET'} ${formData.api.suffix}`
    }
  }

  return {
    title: '未配置接口',
    description: '点击配置接口选择请求器、方法、参数和映射'
  }
})

const exampleData = computed(() => {
  return exampleDataMap[props.component?.type] || {
    success: true,
    message: '示例数据',
    data: [
      { id: 1, name: '示例项一', value: 100 },
      { id: 2, name: '示例项二', value: 200 }
    ]
  }
})

const exampleDataTitle = computed(() => {
  return `${props.component?.name || props.component?.type || '组件'} · 返回示例`
})

const exampleDataDescription = computed(() => {
  return '用于接口返回格式预览，实际请求结果可以按这个结构映射到组件。'
})

const exampleDataText = computed(() => JSON.stringify(exampleData.value, null, 2))

const componentMeta = computed(() => {
  if (!props.component) return ''
  const { x, y, width, height } = props.component
  return `位置 ${Math.round(x)}, ${Math.round(y)} · 尺寸 ${Math.round(width)} × ${Math.round(height)}`
})

const hasUnsavedChanges = computed(() => {
  if (!initialData || !visible.value || !props.component) return false
  return JSON.stringify(formData) !== JSON.stringify(initialData)
})

watch([visible, () => props.component?.id], ([isVisible, componentId]) => {
  if (isVisible && componentId && componentId !== lastComponentId.value) {
    lastComponentId.value = componentId
    if (props.component) {
      updateFormData(props.component)
    }
  }
  if (!isVisible) {
    lastComponentId.value = null
  }
})

const formData = reactive({
  name: '',
  title: '',
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  props: {},
  echartTheme: '',
  colorPalette: '',
  dataSourceId: null,
  dataTransform: {
    enabled: false,
    pathMapping: {},
    transformFunction: ''
  },
  events: [],
  visibilityCondition: '',
  api: {
    url: 'http://localhost:3001',
    suffix: '',
    method: 'GET',
    token: '',
    protocol: 'HTTP',
    interval: 0
  }
})

const formRules = {
  name: [{ required: true, message: '请输入组件名称', trigger: 'blur' }],
  title: [{ required: true, message: '请输入组件标题', trigger: 'blur' }],
  x: [{ required: true, message: '请输入 X 坐标', trigger: 'blur' }],
  y: [{ required: true, message: '请输入 Y 坐标', trigger: 'blur' }],
  width: [{ required: true, message: '请输入宽度', trigger: 'blur' }],
  height: [{ required: true, message: '请输入高度', trigger: 'blur' }],
  'api.url': [{ pattern: /^https?:\/\/.+/, message: '请输入有效的 URL 地址', trigger: 'blur' }]
}

let initialData = null
let isApplyingFormData = false

const cloneData = (value) => JSON.parse(JSON.stringify(value))

const updateFormData = (newComponent) => {
  if (!newComponent) return
  const { title, ...restProps } = newComponent.props || {}

  const data = {
    name: newComponent.name,
    title: newComponent.props?.title || '',
    x: newComponent.x,
    y: newComponent.y,
    width: newComponent.width,
    height: newComponent.height,
    props: JSON.parse(JSON.stringify(restProps)),
    echartTheme: newComponent.echartTheme || '',
    colorPalette: newComponent.colorPalette || '',
    dataSourceId: newComponent.dataSourceId || null,
    dataTransform: newComponent.dataTransform || {
      enabled: false,
      pathMapping: {},
      transformFunction: ''
    },
    events: newComponent.events || [],
    visibilityCondition: newComponent.visibilityCondition || '',
    api: {
      url: newComponent.api?.url || 'http://localhost:3001',
      suffix: newComponent.api?.suffix || '',
      method: newComponent.api?.method || 'GET',
      token: newComponent.api?.token || '',
      protocol: newComponent.api?.protocol || 'HTTP',
      interval: newComponent.api?.interval || 0
    }
  }

  if (newComponent.dataSourceId) dataSourceMode.value = 'datasource'
  else if (newComponent.api?.protocol === 'WS') dataSourceMode.value = 'ws'
  else dataSourceMode.value = 'http'

  isApplyingFormData = true
  Object.assign(formData, data)
  initialData = cloneData(data)
  nextTick(() => {
    isApplyingFormData = false
  })
}

watch(() => formData.props?.cesiumConfig, (cesiumConfig) => {
  if (isApplyingFormData || !visible.value || !props.component || !isCesiumComponent(props.component.type) || !cesiumConfig) return

  panelStore.updateComponent(props.component.id, {
    props: {
      ...(props.component.props || {}),
      cesiumConfig: cloneData(cesiumConfig)
    }
  })
}, { deep: true })

const handleSave = async () => {
  if (!props.component) return
  try {
    saving.value = true
    const shouldUseDataSource = dataSourceMode.value === 'datasource' && Boolean(formData.dataSourceId)
    const shouldUseLegacyApi = !shouldUseDataSource && hasLegacyApiRequestConfig(formData.api)

    panelStore.updateComponent(props.component.id, {
      name: formData.name,
      x: props.component.x,
      y: props.component.y,
      width: props.component.width,
      height: props.component.height,
      echartTheme: formData.echartTheme,
      colorPalette: formData.colorPalette,
      dataSourceId: shouldUseDataSource ? formData.dataSourceId : null,
      dataTransform: shouldUseDataSource ? formData.dataTransform : null,
      events: formData.events,
      visibilityCondition: formData.visibilityCondition,
      props: {
        title: formData.title,
        ...formData.props
      },
      api: shouldUseLegacyApi ? {
        ...formData.api,
        protocol: dataSourceMode.value === 'ws' ? 'WS' : 'HTTP',
        _t: Date.now()
      } : null
    })

    initialData = JSON.parse(JSON.stringify(formData))
    ElMessage.success('保存成功')
    visible.value = false
    saving.value = false
  } catch (error) {
    ElMessage.warning(error.message)
    saving.value = false
  }
}

const handleReset = () => {
  if (!initialData) return
  Object.assign(formData, JSON.parse(JSON.stringify(initialData)))
  ElMessage.info('已重置为初始值')
}

const handleRequestConfirm = ({ dataSourceId, dataTransform, api }) => {
  formData.dataSourceId = dataSourceId
  formData.dataTransform = dataTransform
  formData.api = api || {
    url: 'http://localhost:3001',
    suffix: '',
    method: 'GET',
    token: '',
    protocol: 'HTTP',
    interval: 0
  }
  dataSourceMode.value = dataSourceId ? 'datasource' : 'http'
}

const handleClose = () => {
  if (initialData && JSON.stringify(formData) !== JSON.stringify(initialData)) {
    ElMessage.warning('有未保存的更改')
  }
  visible.value = false
}

const handleSaveAsBusinessComponent = () => emit('save-as-business')

const handleOverlayClick = () => {
  handleClose()
}

const openExampleDataDialog = () => {
  showExampleDataDialog.value = true
}
</script>

<style scoped>
.component-form {
  display: flex;
  flex-direction: column;
  gap: var(--lc-space-4);
  padding: 0;
}

:deep(.el-drawer__body) {
  padding: 20px;
  padding-top: 0 !important;
  padding-bottom: 100px;
  overflow-y: auto;
}

:deep(.el-divider__text) {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: var(--lc-text-primary);
  background-color: var(--lc-bg-panel);
}

.component-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--lc-space-3);
  padding: var(--lc-space-4);
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-xl);
  background: var(--lc-bg-subtle);
}

.component-summary__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.component-summary__main strong,
.component-summary__main span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.component-summary__main strong {
  color: var(--lc-text-primary);
  font-size: var(--lc-font-size-title-sm);
  line-height: var(--lc-line-height-title-sm);
}

.component-summary__main span {
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
}

.component-summary__main .summary-type {
  color: var(--lc-brand-500);
  font-weight: 600;
}

.config-section {
  padding: var(--lc-space-4);
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-xl);
  background: var(--lc-bg-panel);
  box-shadow: var(--lc-shadow-sm);
}

.config-section--flush {
  padding: 0;
  overflow: hidden;
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--lc-space-2);
  margin-bottom: var(--lc-space-4);
  color: var(--lc-text-primary);
  font-size: var(--lc-font-size-body);
  font-weight: 700;
  line-height: var(--lc-line-height-body);
}

.section-title .el-icon {
  color: var(--lc-brand-500);
}

.form-item {
  margin-bottom: 0;
  padding: 0;
  border-radius: var(--lc-radius-md);
  transition: background-color 0.3s ease;
}

.form-label {
  display: block;
  margin-bottom: var(--lc-space-2);
  font-size: var(--lc-font-size-body);
  font-weight: 500;
  color: var(--lc-text-primary);
}

.form-item:hover {
  background-color: transparent;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.hint-text {
  margin-top: var(--lc-space-2);
  font-size: var(--lc-font-size-caption);
  color: var(--lc-text-secondary);
  line-height: 1.5;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--lc-space-3);
}

.quick-actions .el-button {
  width: 100%;
  justify-content: flex-start;
}

.request-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--lc-space-3);
  padding: var(--lc-space-4);
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-subtle);
}

.request-summary > div:first-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.request-summary strong,
.request-summary span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-summary strong {
  font-size: var(--lc-font-size-body);
  color: var(--lc-text-primary);
}

.request-summary span {
  font-size: var(--lc-font-size-caption);
  color: var(--lc-text-secondary);
}

.request-actions {
  display: flex;
  gap: var(--lc-space-2);
  flex-shrink: 0;
}

.footer-status {
  margin-right: auto;
  color: var(--lc-text-tertiary);
  font-size: var(--lc-font-size-caption);
  line-height: 32px;
}

.footer-status.dirty {
  color: var(--lc-warning-600);
  font-weight: 600;
}

.example-data-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.example-data-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.example-data-meta strong {
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.example-data-meta span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.example-data-code {
  min-height: 260px;
  max-height: 60vh;
  margin: 0;
  padding: 16px;
  overflow: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-fill-color-light);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

<style>
.component-drawer .el-drawer__header {
  margin-bottom: 0 !important;
  padding-bottom: 20px !important;
  border-bottom: 2px solid var(--color-border);
  font-weight: 600;
  font-size: 18px;
}
</style>
