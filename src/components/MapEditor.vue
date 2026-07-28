<template>
  <div class="map-editor">
    <el-divider>地图源</el-divider>

    <div class="editor-grid">
      <el-form-item label="地图模式">
        <el-select v-model="localValue.sourceType">
          <el-option label="全国地图" value="china" />
          <el-option label="省份地图" value="province" />
          <el-option label="自定义 GeoJSON" value="custom" />
        </el-select>
      </el-form-item>

      <el-form-item label="地图名称">
        <el-input v-model="localValue.mapName" placeholder="例如：全国态势" />
      </el-form-item>
    </div>

    <div v-if="localValue.sourceType === 'province'" class="editor-grid">
      <el-form-item label="省份">
        <el-select v-model="localValue.presetMapCode" filterable>
          <el-option v-for="item in provinceOptions" :key="item.code" :label="item.label" :value="item.code" />
        </el-select>
      </el-form-item>

      <el-form-item label="下钻">
        <el-switch v-model="localValue.enableDrilldown" active-text="允许点击下钻" />
      </el-form-item>
    </div>

    <div v-if="localValue.sourceType === 'china'" class="switch-row">
      <el-switch v-model="localValue.enableDrilldown" active-text="允许点击下钻到省份" />
    </div>

    <div v-if="localValue.sourceType === 'custom'">
      <el-divider>GeoJSON</el-divider>
      <el-input v-model="geoJsonText" type="textarea" :rows="8" placeholder="输入 GeoJSON FeatureCollection" />
    </div>

    <el-divider>基础交互</el-divider>

    <div class="editor-grid">
      <el-form-item label="缩放">
        <el-input-number v-model="localValue.zoom" :min="0.5" :max="10" :step="0.1" />
      </el-form-item>

      <el-form-item label="标注偏移 Y">
        <el-input-number v-model="localValue.labelOffsetY" :min="-40" :max="40" :step="1" />
      </el-form-item>
    </div>

    <div class="switch-row">
      <el-switch v-model="localValue.roam" active-text="允许缩放拖拽" />
      <el-switch v-model="localValue.showLabel" active-text="显示区域名称" />
      <el-switch v-model="localValue.showVisualMap" active-text="显示视觉映射" />
      <el-switch v-model="localValue.showScatterLabel" active-text="显示散点名称" />
    </div>

    <el-divider>联动配置</el-divider>
    <div class="editor-grid">
      <el-form-item label="变量名">
        <el-input v-model="localValue.selectedRegionVariable" placeholder="例如：selectedMapRegion" />
      </el-form-item>
      <el-form-item label="点击联动">
        <el-switch v-model="localValue.enableRegionSelect" active-text="点击区域写入变量" />
      </el-form-item>
    </div>

    <el-divider>地图样式</el-divider>

    <div class="style-grid">
      <el-form-item label="底色">
        <el-color-picker v-model="localValue.areaColor" show-alpha />
      </el-form-item>
      <el-form-item label="高亮色">
        <el-color-picker v-model="localValue.emphasisAreaColor" show-alpha />
      </el-form-item>
      <el-form-item label="描边色">
        <el-color-picker v-model="localValue.borderColor" show-alpha />
      </el-form-item>
      <el-form-item label="描边宽度">
        <el-input-number v-model="localValue.borderWidth" :min="0" :max="8" :step="0.2" />
      </el-form-item>
    </div>

    <el-divider>散点样式</el-divider>

    <div class="style-grid">
      <el-form-item label="散点颜色">
        <el-color-picker v-model="localValue.scatterColor" show-alpha />
      </el-form-item>
      <el-form-item label="发光颜色">
        <el-color-picker v-model="localValue.scatterShadowColor" show-alpha />
      </el-form-item>
      <el-form-item label="最小尺寸">
        <el-input-number v-model="localValue.scatterMinSize" :min="4" :max="40" :step="1" />
      </el-form-item>
      <el-form-item label="最大尺寸">
        <el-input-number v-model="localValue.scatterMaxSize" :min="8" :max="60" :step="1" />
      </el-form-item>
    </div>

    <el-divider>飞线样式</el-divider>

    <div class="style-grid">
      <el-form-item label="飞线颜色">
        <el-color-picker v-model="localValue.lineColor" show-alpha />
      </el-form-item>
      <el-form-item label="飞线宽度">
        <el-input-number v-model="localValue.lineWidth" :min="1" :max="10" :step="0.5" />
      </el-form-item>
      <el-form-item label="弯曲度">
        <el-input-number v-model="localValue.lineCurveness" :min="0" :max="1" :step="0.05" />
      </el-form-item>
      <el-form-item label="箭头大小">
        <el-input-number v-model="localValue.lineSymbolSize" :min="4" :max="20" :step="1" />
      </el-form-item>
    </div>

    <el-divider>区域数据</el-divider>
    <div class="table-actions">
      <el-button size="small" @click="addRegionRow">新增区域</el-button>
    </div>
    <el-table :data="regionRows" size="small" border>
      <el-table-column label="名称">
        <template #default="{ row }">
          <el-input v-model="row.name" placeholder="区域名称" @input="syncRegionRows" />
        </template>
      </el-table-column>
      <el-table-column label="值" width="120">
        <template #default="{ row }">
          <el-input-number v-model="row.value" :min="0" :step="1" @change="syncRegionRows" />
        </template>
      </el-table-column>
      <el-table-column label="编码" width="140">
        <template #default="{ row }">
          <el-input v-model="row.adcode" placeholder="可选 adcode" @input="syncRegionRows" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" @click="removeRegionRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-divider>散点数据</el-divider>
    <div class="table-actions">
      <el-button size="small" @click="addScatterRow">新增散点</el-button>
    </div>
    <el-table :data="scatterRows" size="small" border>
      <el-table-column label="名称">
        <template #default="{ row }">
          <el-input v-model="row.name" placeholder="散点名称" @input="syncScatterRows" />
        </template>
      </el-table-column>
      <el-table-column label="经度" width="120">
        <template #default="{ row }">
          <el-input-number v-model="row.lng" :step="0.001" @change="syncScatterRows" />
        </template>
      </el-table-column>
      <el-table-column label="纬度" width="120">
        <template #default="{ row }">
          <el-input-number v-model="row.lat" :step="0.001" @change="syncScatterRows" />
        </template>
      </el-table-column>
      <el-table-column label="值" width="120">
        <template #default="{ row }">
          <el-input-number v-model="row.value" :min="0" :step="1" @change="syncScatterRows" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" @click="removeScatterRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-divider>飞线数据</el-divider>
    <div class="table-actions">
      <el-button size="small" @click="addLineRow">新增飞线</el-button>
    </div>
    <el-table :data="lineRows" size="small" border>
      <el-table-column label="起点">
        <template #default="{ row }">
          <el-input v-model="row.fromName" placeholder="起点名称" @input="syncLineRows" />
        </template>
      </el-table-column>
      <el-table-column label="终点">
        <template #default="{ row }">
          <el-input v-model="row.toName" placeholder="终点名称" @input="syncLineRows" />
        </template>
      </el-table-column>
      <el-table-column label="起点经纬" width="180">
        <template #default="{ row }">
          <div class="coord-pair">
            <el-input-number v-model="row.fromLng" :step="0.001" @change="syncLineRows" />
            <el-input-number v-model="row.fromLat" :step="0.001" @change="syncLineRows" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="终点经纬" width="180">
        <template #default="{ row }">
          <div class="coord-pair">
            <el-input-number v-model="row.toLng" :step="0.001" @change="syncLineRows" />
            <el-input-number v-model="row.toLat" :step="0.001" @change="syncLineRows" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="值" width="120">
        <template #default="{ row }">
          <el-input-number v-model="row.value" :min="0" :step="1" @change="syncLineRows" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" @click="removeLineRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-collapse class="json-fallback">
      <el-collapse-item title="高级 JSON 编辑">
        <el-divider>区域 JSON</el-divider>
        <el-input v-model="regionDataText" type="textarea" :rows="6" placeholder='[{"name":"北京","value":92}]' />

        <el-divider>散点 JSON</el-divider>
        <el-input v-model="scatterDataText" type="textarea" :rows="6" placeholder='[{"name":"调度中心","value":[116.4,39.9,120]}]' />

        <el-divider>飞线 JSON</el-divider>
        <el-input v-model="lineDataText" type="textarea" :rows="6" placeholder='[{"fromName":"北京","toName":"上海","coords":[[116.4,39.9],[121.47,31.23]],"value":88}]' />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { provinceOptions } from '../utils/mapPresets'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const createDefaultValue = () => ({
  sourceType: 'custom',
  mapName: '地图组件',
  presetMapCode: '',
  enableDrilldown: true,
  enableRegionSelect: true,
  selectedRegionVariable: 'selectedMapRegion',
  geoJson: { type: 'FeatureCollection', features: [] },
  regionData: [],
  scatterData: [],
  lineData: [],
  roam: true,
  showLabel: true,
  showVisualMap: true,
  showScatterLabel: true,
  zoom: 1.1,
  labelOffsetY: 0,
  areaColor: 'rgba(16,36,63,0.95)',
  emphasisAreaColor: '#0b5cff',
  borderColor: '#2f7ef7',
  borderWidth: 1.2,
  scatterColor: '#ffd166',
  scatterShadowColor: '#ffd166',
  scatterMinSize: 10,
  scatterMaxSize: 26,
  lineColor: '#00e5a8',
  lineWidth: 2,
  lineCurveness: 0.3,
  lineSymbolSize: 8
})

const localValue = reactive(createDefaultValue())
let lastSyncedJson = JSON.stringify(createDefaultValue())

const syncLocalValue = (value) => {
  const nextValue = Object.assign(createDefaultValue(), JSON.parse(JSON.stringify(value || {})))
  lastSyncedJson = JSON.stringify(nextValue)
  Object.assign(localValue, nextValue)
}

watch(
  () => props.modelValue,
  (value) => {
    syncLocalValue(value)
  },
  { immediate: true, deep: true }
)

watch(
  localValue,
  (value) => {
    const nextJson = JSON.stringify(value)
    if (nextJson === lastSyncedJson) return
    lastSyncedJson = nextJson
    emit('update:modelValue', JSON.parse(nextJson))
  },
  { deep: true }
)

const updateField = (field, value) => {
  localValue[field] = value
}

const updateJsonField = (field, raw) => {
  try {
    const parsed = raw?.trim()
      ? JSON.parse(raw)
      : field === 'geoJson'
        ? { type: 'FeatureCollection', features: [] }
        : []
    updateField(field, parsed)
  } catch {
    ElMessage.warning(`${field} JSON 格式不正确`)
  }
}

const createJsonComputed = (field, fallback) => computed({
  get: () => JSON.stringify(localValue?.[field] ?? fallback, null, 2),
  set: (value) => updateJsonField(field, value)
})

const createArrayComputed = (field, mapGet, mapSet) => computed({
  get: () => (localValue?.[field] || []).map(mapGet),
  set: (rows) => updateField(field, rows.map(mapSet))
})

const regionRows = createArrayComputed(
  'regionData',
  (item) => ({ name: item.name || '', value: Number(item.value) || 0, adcode: item.adcode || '' }),
  (row) => ({ name: row.name || '', value: Number(row.value) || 0, ...(row.adcode ? { adcode: row.adcode } : {}) })
)

const scatterRows = createArrayComputed(
  'scatterData',
  (item) => ({
    name: item.name || '',
    lng: Number(item.value?.[0]) || 0,
    lat: Number(item.value?.[1]) || 0,
    value: Number(item.value?.[2]) || 0
  }),
  (row) => ({
    name: row.name || '',
    value: [Number(row.lng) || 0, Number(row.lat) || 0, Number(row.value) || 0]
  })
)

const lineRows = createArrayComputed(
  'lineData',
  (item) => ({
    fromName: item.fromName || '',
    toName: item.toName || '',
    fromLng: Number(item.coords?.[0]?.[0]) || 0,
    fromLat: Number(item.coords?.[0]?.[1]) || 0,
    toLng: Number(item.coords?.[1]?.[0]) || 0,
    toLat: Number(item.coords?.[1]?.[1]) || 0,
    value: Number(item.value) || 0
  }),
  (row) => ({
    fromName: row.fromName || '',
    toName: row.toName || '',
    coords: [
      [Number(row.fromLng) || 0, Number(row.fromLat) || 0],
      [Number(row.toLng) || 0, Number(row.toLat) || 0]
    ],
    value: Number(row.value) || 0
  })
)

const regionDataText = createJsonComputed('regionData', [])
const scatterDataText = createJsonComputed('scatterData', [])
const lineDataText = createJsonComputed('lineData', [])
const geoJsonText = createJsonComputed('geoJson', { type: 'FeatureCollection', features: [] })

const syncRegionRows = () => {
  regionRows.value = [...regionRows.value]
}

const syncScatterRows = () => {
  scatterRows.value = [...scatterRows.value]
}

const syncLineRows = () => {
  lineRows.value = [...lineRows.value]
}

const addRegionRow = () => {
  regionRows.value = [...regionRows.value, { name: '', value: 0, adcode: '' }]
}

const removeRegionRow = (index) => {
  const rows = [...regionRows.value]
  rows.splice(index, 1)
  regionRows.value = rows
}

const addScatterRow = () => {
  scatterRows.value = [...scatterRows.value, { name: '', lng: 0, lat: 0, value: 0 }]
}

const removeScatterRow = (index) => {
  const rows = [...scatterRows.value]
  rows.splice(index, 1)
  scatterRows.value = rows
}

const addLineRow = () => {
  lineRows.value = [...lineRows.value, { fromName: '', toName: '', fromLng: 0, fromLat: 0, toLng: 0, toLat: 0, value: 0 }]
}

const removeLineRow = (index) => {
  const rows = [...lineRows.value]
  rows.splice(index, 1)
  lineRows.value = rows
}
</script>

<style scoped>
.editor-grid,
.style-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.switch-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 4px 0 8px;
}

.table-actions {
  margin-bottom: 10px;
}

.coord-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.json-fallback {
  margin-top: 16px;
}

.map-editor :deep(.el-input-number),
.map-editor :deep(.el-select) {
  width: 100%;
}
</style>
