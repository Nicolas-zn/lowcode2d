<template>
  <div class="cesium-config-panel">
    <el-tabs v-model="activeConfigTab" class="cesium-tabs" stretch>
      <el-tab-pane label="底图场景" name="base">
        <div class="tab-pane-content">
          <div class="tab-section-title">底图</div>
          <el-form-item label="底图">
            <el-select v-model="configData.baseMap" placeholder="选择底图类型" style="width: 100%;">
              <el-option v-for="item in baseMapOptions" :key="item.value" :label="item.label" :value="item.value">
                <span>{{ item.label }}</span>
                <span style="float: right; color: var(--el-text-color-secondary); font-size: 12px;">{{ item.desc }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="天地图Token">
            <el-input v-model="configData.tiandituToken" placeholder="请输入天地图 tk" clearable show-password />
          </el-form-item>
          <el-form-item label="底图透明">
            <el-slider v-model="configData.baseMapOpacity" :min="0" :max="1" :step="0.05" />
          </el-form-item>

          <div class="tab-section-title">场景效果</div>
          <div class="switch-grid">
            <el-form-item label="全球地形">
              <el-switch v-model="configData.terrain" />
            </el-form-item>
            <el-form-item label="测试物料">
              <el-switch v-model="configData.showTestEntities" />
            </el-form-item>
            <el-form-item label="太阳光照">
              <el-switch v-model="configData.scene.enableLighting" />
            </el-form-item>
            <el-form-item label="地形遮挡">
              <el-switch v-model="configData.scene.depthTestAgainstTerrain" />
            </el-form-item>
            <el-form-item label="天空盒">
              <el-switch v-model="configData.scene.showSkyBox" />
            </el-form-item>
            <el-form-item label="大气层">
              <el-switch v-model="configData.scene.showSkyAtmosphere" />
            </el-form-item>
            <el-form-item label="太阳">
              <el-switch v-model="configData.scene.showSun" />
            </el-form-item>
            <el-form-item label="月亮">
              <el-switch v-model="configData.scene.showMoon" />
            </el-form-item>
            <el-form-item label="雾效">
              <el-switch v-model="configData.scene.fog" />
            </el-form-item>
          </div>
          <el-form-item label="雾效密度">
            <el-slider v-model="configData.scene.fogDensity" :min="0" :max="0.003" :step="0.0001" :disabled="!configData.scene.fog" />
          </el-form-item>
        </div>
      </el-tab-pane>

      <el-tab-pane label="视角交互" name="camera">
        <div class="tab-pane-content">
          <div class="tab-section-title">视角设置</div>
          <div class="camera-grid">
            <el-form-item label="经度">
              <el-input-number v-model="configData.camera.longitude" :precision="6" :step="0.01" :min="-180" :max="180" controls-position="right" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="纬度">
              <el-input-number v-model="configData.camera.latitude" :precision="6" :step="0.01" :min="-90" :max="90" controls-position="right" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="高度(m)">
              <el-input-number v-model="configData.camera.height" :min="100" :max="50000000" :step="1000" controls-position="right" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="航向角">
              <el-input-number v-model="configData.camera.heading" :min="0" :max="360" :step="1" controls-position="right" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="俯仰角">
              <el-input-number v-model="configData.camera.pitch" :min="-90" :max="90" :step="1" controls-position="right" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="翻滚角">
              <el-input-number v-model="configData.camera.roll" :min="-180" :max="180" :step="1" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </div>
          <el-form-item label="快速定位">
            <el-select v-model="quickLocation" placeholder="选择城市" @change="handleQuickLocation" style="width: 100%;">
              <el-option v-for="loc in quickLocations" :key="loc.name" :label="loc.name" :value="loc.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="视角保存">
            <el-button type="primary" :icon="Camera" @click="saveCurrentView" style="width: 100%;">
              保存当前视角为默认
            </el-button>
          </el-form-item>

          <div class="tab-section-title">交互控制</div>
          <div class="switch-grid">
            <el-form-item label="旋转">
              <el-switch v-model="configData.controls.enableRotate" />
            </el-form-item>
            <el-form-item label="缩放">
              <el-switch v-model="configData.controls.enableZoom" />
            </el-form-item>
            <el-form-item label="倾斜">
              <el-switch v-model="configData.controls.enableTilt" />
            </el-form-item>
          </div>
          <div class="camera-grid">
            <el-form-item label="最近距离">
              <el-input-number v-model="configData.controls.minZoomDistance" :min="1" :step="50" controls-position="right" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="最远距离">
              <el-input-number v-model="configData.controls.maxZoomDistance" :min="1000" :step="10000" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="路线" name="route">
        <div class="tab-pane-content">
          <div class="tab-section-title">路线漫游</div>
          <el-form-item label="漫游高度">
            <el-input-number v-model="configData.routeHeight" :min="10" :max="10000" :step="10" controls-position="right" style="width: 100%;" placeholder="漫游高度(米)" />
          </el-form-item>
          <div class="camera-grid">
            <el-form-item label="路线颜色">
              <el-color-picker v-model="configData.routeStyle.color" />
            </el-form-item>
            <el-form-item label="路线宽度">
              <el-input-number v-model="configData.routeStyle.width" :min="1" :max="20" :step="1" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </div>
          <div class="switch-grid">
            <el-form-item label="显示路线">
              <el-switch v-model="configData.routeStyle.visible" />
            </el-form-item>
            <el-form-item label="路线贴地">
              <el-switch v-model="configData.routeStyle.clampToGround" />
            </el-form-item>
          </div>

          <div v-if="configData.routePoints && configData.routePoints.length === 0" class="empty-hint">
            <el-text type="info" size="small">暂无路线点，点击下方按钮添加</el-text>
          </div>

          <div v-for="(point, index) in configData.routePoints" :key="'route-' + index" class="layer-card">
            <div class="layer-header">
              <span style="font-size: 12px; color: var(--el-text-color-secondary);">点 {{ index + 1 }}</span>
              <el-button type="danger" size="small" :icon="Delete" circle @click="removeRoutePoint(index)" />
            </div>
            <div class="layer-body">
              <el-form-item label="经度" label-width="60px">
                <el-input-number v-model="point.longitude" :precision="6" :step="0.001" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="纬度" label-width="60px">
                <el-input-number v-model="point.latitude" :precision="6" :step="0.001" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="高度" label-width="60px">
                <el-input-number v-model="point.height" :min="0" :step="10" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="停留ms" label-width="60px">
                <el-input-number v-model="point.delay" :min="0" :step="500" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
            </div>
          </div>

          <el-button type="warning" :icon="Plus" @click="addRoutePoint" style="width: 100%; margin-top: 8px;">
            添加路线点
          </el-button>
          <el-button v-if="configData.routePoints && configData.routePoints.length > 0" type="success" :icon="VideoPlay" @click="startRouteAnimation" style="width: 100%; margin-top: 8px;">
            开始漫游
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="图层" name="layers">
        <div class="tab-pane-content">
          <div class="tab-section-title">图层管理</div>
          <div v-if="configData.layers.length === 0" class="empty-hint">
            <el-text type="info" size="small">暂无图层，点击下方按钮添加</el-text>
          </div>

          <div v-for="(layer, index) in configData.layers" :key="index" class="layer-card">
            <div class="layer-header">
              <el-switch v-model="layer.visible" size="small" />
              <el-input v-model="layer.name" size="small" placeholder="图层名称" style="flex: 1;" />
              <el-button type="danger" size="small" :icon="Delete" circle @click="removeLayer(index)" />
            </div>
            <div class="layer-body" v-show="layer.visible">
              <el-form-item label="类型" label-width="60px">
                <el-select v-model="layer.type" size="small" style="width: 100%;">
                  <el-option label="WMS" value="wms" />
                  <el-option label="WMTS" value="wmts" />
                  <el-option label="GeoJSON" value="geojson" />
                  <el-option label="KML" value="kml" />
                </el-select>
              </el-form-item>
              <el-form-item label="URL" label-width="60px">
                <el-input v-model="layer.url" size="small" placeholder="图层服务地址" />
              </el-form-item>
              <el-form-item v-if="layer.type === 'wms' || layer.type === 'wmts'" label="图层名" label-width="60px">
                <el-input v-model="layer.layerName" size="small" placeholder="图层名称" />
              </el-form-item>
              <el-form-item v-if="layer.type === 'wmts'" label="矩阵集" label-width="60px">
                <el-input v-model="layer.tileMatrixSetID" size="small" placeholder="GoogleMapsCompatible" />
              </el-form-item>
              <el-form-item v-if="layer.type === 'wmts'" label="样式" label-width="60px">
                <el-input v-model="layer.style" size="small" placeholder="default" />
              </el-form-item>
              <el-form-item v-if="layer.type === 'wms' || layer.type === 'wmts'" label="格式" label-width="60px">
                <el-input v-model="layer.format" size="small" placeholder="image/png" />
              </el-form-item>
              <template v-if="layer.type === 'geojson'">
                <el-form-item label="边框色" label-width="60px">
                  <el-color-picker v-model="layer.strokeColor" size="small" />
                </el-form-item>
                <el-form-item label="填充色" label-width="60px">
                  <el-color-picker v-model="layer.fillColor" size="small" />
                </el-form-item>
                <el-form-item label="边框宽" label-width="60px">
                  <el-input-number v-model="layer.strokeWidth" :min="1" :max="10" :step="1" size="small" controls-position="right" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="贴地" label-width="60px">
                  <el-switch v-model="layer.clampToGround" size="small" />
                </el-form-item>
              </template>
              <el-form-item label="透明度" label-width="60px">
                <el-slider v-model="layer.opacity" :min="0" :max="1" :step="0.05" :show-tooltip="true" />
              </el-form-item>
            </div>
          </div>

          <el-button type="primary" :icon="Plus" @click="addLayer" style="width: 100%; margin-top: 8px;">
            添加图层
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="标注" name="markers">
        <div class="tab-pane-content">
          <div class="tab-section-title">标注管理</div>
          <div v-if="configData.markers.length === 0" class="empty-hint">
            <el-text type="info" size="small">暂无标注，点击下方按钮添加</el-text>
          </div>

          <div v-for="(marker, index) in configData.markers" :key="'marker-' + index" class="layer-card">
            <div class="layer-header">
              <el-switch v-model="marker.visible" size="small" />
              <el-input v-model="marker.name" size="small" placeholder="标注名称" style="flex: 1;" />
              <el-button type="danger" size="small" :icon="Delete" circle @click="removeMarker(index)" />
            </div>
            <div class="layer-body" v-show="marker.visible">
              <el-form-item label="标签" label-width="60px">
                <el-input v-model="marker.label" size="small" placeholder="显示文字" />
              </el-form-item>
              <el-form-item label="图标URL" label-width="60px">
                <el-input v-model="marker.iconUrl" size="small" placeholder="为空时显示点标注" />
              </el-form-item>
              <el-form-item label="经度" label-width="60px">
                <el-input-number v-model="marker.longitude" :precision="6" :step="0.001" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="纬度" label-width="60px">
                <el-input-number v-model="marker.latitude" :precision="6" :step="0.001" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="高度" label-width="60px">
                <el-input-number v-model="marker.height" :min="0" :step="10" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="点颜色" label-width="60px">
                <el-color-picker v-model="marker.color" size="small" />
              </el-form-item>
              <el-form-item label="点大小" label-width="60px">
                <el-input-number v-model="marker.pixelSize" :min="4" :max="48" :step="1" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="文字色" label-width="60px">
                <el-color-picker v-model="marker.labelColor" size="small" />
              </el-form-item>
              <el-form-item label="文字大小" label-width="60px">
                <el-input-number v-model="marker.fontSize" :min="10" :max="40" :step="1" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <div class="switch-grid small">
                <el-form-item label="显示文字" label-width="70px">
                  <el-switch v-model="marker.labelVisible" size="small" />
                </el-form-item>
                <el-form-item label="文字背景" label-width="70px">
                  <el-switch v-model="marker.labelBackground" size="small" />
                </el-form-item>
                <el-form-item label="贴地" label-width="70px">
                  <el-switch v-model="marker.clampToGround" size="small" />
                </el-form-item>
                <el-form-item label="穿透显示" label-width="70px">
                  <el-switch v-model="marker.depthTest" :active-value="false" :inactive-value="true" size="small" />
                </el-form-item>
              </div>
            </div>
          </div>

          <el-button type="primary" :icon="Plus" @click="addMarker" style="width: 100%; margin-top: 8px;">
            添加标注
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="模型" name="models">
        <div class="tab-pane-content">
          <div class="tab-section-title">模型管理</div>
          <div v-if="configData.models.length === 0" class="empty-hint">
            <el-text type="info" size="small">暂无模型，点击下方按钮添加</el-text>
          </div>

          <div v-for="(model, index) in configData.models" :key="'model-' + index" class="layer-card">
            <div class="layer-header">
              <el-switch v-model="model.visible" size="small" />
              <el-input v-model="model.name" size="small" placeholder="模型名称" style="flex: 1;" />
              <el-button type="danger" size="small" :icon="Delete" circle @click="removeModel(index)" />
            </div>
            <div class="layer-body" v-show="model.visible">
              <el-form-item label="类型" label-width="60px">
                <el-select v-model="model.type" size="small" style="width: 100%;">
                  <el-option label="glTF 模型" value="gltf" />
                  <el-option label="GLB 模型" value="glb" />
                  <el-option label="3D Tiles" value="3dtiles" />
                  <el-option label="OBJ 模型" value="obj" />
                  <el-option label="FBX 模型" value="fbx" />
                </el-select>
              </el-form-item>
              <el-form-item label="URL" label-width="60px">
                <el-input v-model="model.url" size="small" placeholder="模型文件地址" />
              </el-form-item>
              <el-form-item label="经度" label-width="60px">
                <el-input-number v-model="model.longitude" :precision="6" :step="0.001" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="纬度" label-width="60px">
                <el-input-number v-model="model.latitude" :precision="6" :step="0.001" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="高度(m)" label-width="60px">
                <el-input-number v-model="model.height" :min="0" :step="10" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item v-if="model.type === 'gltf' || model.type === 'glb' || model.type === 'obj' || model.type === 'fbx'" label="缩放" label-width="60px">
                <el-input-number v-model="model.scale" :min="0.01" :max="1000" :step="0.1" :precision="2" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item v-if="model.type === 'gltf' || model.type === 'glb' || model.type === 'obj' || model.type === 'fbx'" label="最小像素" label-width="60px">
                <el-input-number v-model="model.minimumPixelSize" :min="0" :max="512" :step="8" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item v-if="model.type === '3dtiles'" label="屏幕误差" label-width="60px">
                <el-input-number v-model="model.maximumScreenSpaceError" :min="1" :max="64" :step="1" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="航向" label-width="60px">
                <el-input-number v-model="model.heading" :min="0" :max="360" :step="1" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="俯仰" label-width="60px">
                <el-input-number v-model="model.pitch" :min="-180" :max="180" :step="1" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="翻滚" label-width="60px">
                <el-input-number v-model="model.roll" :min="-180" :max="180" :step="1" size="small" controls-position="right" style="width: 100%;" />
              </el-form-item>
              <template v-if="model.type === 'gltf' || model.type === 'glb' || model.type === 'obj' || model.type === 'fbx'">
                <el-form-item label="混合色" label-width="60px">
                  <el-color-picker v-model="model.color" size="small" />
                </el-form-item>
                <el-form-item label="混合度" label-width="60px">
                  <el-slider v-model="model.colorBlendAmount" :min="0" :max="1" :step="0.05" />
                </el-form-item>
              </template>
            </div>
          </div>

          <el-button type="success" :icon="Plus" @click="addModel" style="width: 100%; margin-top: 8px;">
            添加模型
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { reactive, watch, ref, nextTick } from 'vue'
import { MapLocation, Aim, Files, Box, Plus, Delete, Camera, Position, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  component: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

// 快速定位城市
const activeConfigTab = ref('base')
const quickLocation = ref('')
const quickLocations = [
  { name: '北京', longitude: 116.3912757, latitude: 39.906217, height: 80000 },
  { name: '上海', longitude: 121.473701, latitude: 31.230416, height: 80000 },
  { name: '广州', longitude: 113.264385, latitude: 23.129112, height: 80000 },
  { name: '深圳', longitude: 114.057868, latitude: 22.543099, height: 60000 },
  { name: '成都', longitude: 104.066541, latitude: 30.572269, height: 80000 },
  { name: '武汉', longitude: 114.305393, latitude: 30.593099, height: 80000 },
  { name: '杭州', longitude: 120.15507, latitude: 30.274085, height: 80000 },
  { name: '全球', longitude: 116.3912757, latitude: 39.906217, height: 15000000 }
]

// 底图选项
const baseMapOptions = [
  { label: '天地图影像', value: 'tianditu_img', desc: '卫星影像' },
  { label: '天地图矢量', value: 'tianditu_vec', desc: '矢量底图' },
  { label: '天地图地形', value: 'tianditu_ter', desc: '地形晕渲' },
  { label: 'OpenStreetMap', value: 'osm', desc: '开源地图' },
  { label: 'ArcGIS 影像', value: 'arcgis', desc: 'Esri 卫星' }
]

const defaultPanelConfig = () => ({
  baseMap: 'tianditu_img',
  tiandituToken: 'b72aa81ac2b3571ffd1b5e82ea1eef6c',
  baseMapOpacity: 1,
  camera: {
    longitude: 116.3912757,
    latitude: 39.906217,
    height: 15000000,
    heading: 0,
    pitch: -90,
    roll: 0
  },
  scene: {
    enableLighting: false,
    depthTestAgainstTerrain: false,
    showSkyBox: true,
    showSkyAtmosphere: true,
    showSun: true,
    showMoon: true,
    fog: true,
    fogDensity: 0.0006
  },
  controls: {
    enableRotate: true,
    enableZoom: true,
    enableTilt: true,
    minZoomDistance: 50,
    maxZoomDistance: 50000000
  },
  layers: [],
  models: [],
  markers: [],
  terrain: false,
  showTestEntities: true,
  routeHeight: 500,
  routePoints: [],
  routeStyle: {
    visible: true,
    color: '#67C23A',
    width: 4,
    clampToGround: false
  }
})

// 配置数据
const configData = reactive(defaultPanelConfig())

// 防止双向watch循环
let isUpdating = false

// 初始化配置
watch(() => props.modelValue, (val) => {
  if (isUpdating) return
  if (val && Object.keys(val).length > 0) {
    isUpdating = true
    if (val.baseMap !== undefined) configData.baseMap = val.baseMap
    if (val.tiandituToken !== undefined) configData.tiandituToken = val.tiandituToken
    if (val.baseMapOpacity !== undefined) configData.baseMapOpacity = val.baseMapOpacity
    if (val.camera) Object.assign(configData.camera, val.camera)
    if (val.scene) Object.assign(configData.scene, val.scene)
    if (val.controls) Object.assign(configData.controls, val.controls)
    if (val.layers) configData.layers = JSON.parse(JSON.stringify(val.layers))
    if (val.models) configData.models = JSON.parse(JSON.stringify(val.models))
    if (val.markers) configData.markers = JSON.parse(JSON.stringify(val.markers))
    if (val.terrain !== undefined) configData.terrain = val.terrain
    if (val.showTestEntities !== undefined) configData.showTestEntities = val.showTestEntities
    if (val.routeHeight !== undefined) configData.routeHeight = val.routeHeight
    if (val.routePoints) configData.routePoints = JSON.parse(JSON.stringify(val.routePoints))
    if (val.routeStyle) Object.assign(configData.routeStyle, val.routeStyle)
    nextTick(() => { isUpdating = false })
  }
}, { immediate: true, deep: false })

// 配置变化时 emit
watch(configData, () => {
  if (isUpdating) return
  isUpdating = true
  emit('update:modelValue', JSON.parse(JSON.stringify(configData)))
  nextTick(() => { isUpdating = false })
}, { deep: true })

// 快速定位
const handleQuickLocation = (name) => {
  const loc = quickLocations.find(l => l.name === name)
  if (loc) {
    configData.camera.longitude = loc.longitude
    configData.camera.latitude = loc.latitude
    configData.camera.height = loc.height
  }
}

// 添加图层
const addLayer = () => {
  configData.layers.push({
    name: `图层${configData.layers.length + 1}`,
    type: 'wms',
    url: '',
    layerName: '',
    tileMatrixSetID: 'GoogleMapsCompatible',
    style: 'default',
    format: 'image/png',
    visible: true,
    opacity: 1,
    strokeColor: '#409EFF',
    fillColor: '#409EFF',
    strokeWidth: 2,
    clampToGround: false
  })
}

// 移除图层
const removeLayer = (index) => {
  configData.layers.splice(index, 1)
}

// 添加模型
const addModel = () => {
  configData.models.push({
    name: `模型${configData.models.length + 1}`,
    type: 'gltf',
    url: '',
    visible: true,
    longitude: configData.camera.longitude,
    latitude: configData.camera.latitude,
    height: 0,
    scale: 1.0,
    heading: 0,
    pitch: 0,
    roll: 0,
    minimumPixelSize: 64,
    maximumScreenSpaceError: 16,
    color: '',
    colorBlendAmount: 0.5
  })
}

// 移除模型
const removeModel = (index) => {
  configData.models.splice(index, 1)
}

// 添加标注
const addMarker = () => {
  configData.markers.push({
    name: `标注${configData.markers.length + 1}`,
    label: `标注${configData.markers.length + 1}`,
    visible: true,
    longitude: configData.camera.longitude,
    latitude: configData.camera.latitude,
    height: 0,
    iconUrl: '',
    color: '#F56C6C',
    alpha: 1,
    pixelSize: 12,
    outlineColor: '#FFFFFF',
    outlineWidth: 2,
    labelVisible: true,
    labelColor: '#FFFFFF',
    labelOutlineColor: '#000000',
    fontSize: 14,
    labelBackground: true,
    labelBackgroundColor: '#000000',
    labelBackgroundAlpha: 0.45,
    labelOffsetY: -28,
    clampToGround: false,
    depthTest: false
  })
}

// 移除标注
const removeMarker = (index) => {
  configData.markers.splice(index, 1)
}

// 保存当前视角
const saveCurrentView = () => {
  // 通过全局查找 Cesium viewer
  const cesiumContainer = document.querySelector('.cesium-brick')
  if (!cesiumContainer) {
    ElMessage.warning('请先在画布中添加并查看 Cesium 地图')
    return
  }

  // 从 Cesium DOM 获取 viewer 实例
  const viewer = window.cesiumViewer
  if (!viewer) {
    ElMessage.warning('地图未初始化，请刷新页面后重试')
    return
  }

  try {
    const camera = viewer.camera
    const position = camera.positionCartographic

    configData.camera.longitude = parseFloat((position.longitude * 180 / Math.PI).toFixed(6))
    configData.camera.latitude = parseFloat((position.latitude * 180 / Math.PI).toFixed(6))
    configData.camera.height = parseFloat(position.height.toFixed(2))
    configData.camera.heading = parseFloat((camera.heading * 180 / Math.PI).toFixed(2))
    configData.camera.pitch = parseFloat((camera.pitch * 180 / Math.PI).toFixed(2))
    configData.camera.roll = parseFloat((camera.roll * 180 / Math.PI).toFixed(2))

    ElMessage.success('当前视角已保存为默认视角')
  } catch (error) {
    ElMessage.error('保存视角失败: ' + error.message)
  }
}

// 添加路线点
const addRoutePoint = () => {
  configData.routePoints.push({
    longitude: configData.camera.longitude,
    latitude: configData.camera.latitude,
    height: configData.routeHeight,
    heading: 0,
    pitch: -45,
    roll: 0,
    duration: 3,
    delay: 1000
  })
}

// 移除路线点
const removeRoutePoint = (index) => {
  configData.routePoints.splice(index, 1)
}

// 开始路线漫游
const startRouteAnimation = () => {
  if (!window.$cesiumBrick) {
    ElMessage.warning('地图未初始化，请先在画布中查看地图')
    return
  }

  if (!configData.routePoints || configData.routePoints.length < 2) {
    ElMessage.warning('至少需要2个路线点')
    return
  }

  ElMessage.success('开始路线漫游')

  const points = configData.routePoints.map(point => ({
    ...point,
    height: point.height || configData.routeHeight,
    heading: point.heading ?? 0,
    pitch: point.pitch ?? -45,
    roll: point.roll ?? 0,
    duration: point.duration ?? 3,
    delay: point.delay ?? 1000
  }))
  const height = configData.routeHeight || 500
  window.$cesiumBrick.drawRoute(points, height, configData.routeStyle)
  window.$cesiumBrick.startCameraRoam(points)
}
</script>

<style scoped>
.cesium-config-panel {
  width: 100%;
}

.cesium-tabs {
  width: 100%;
}

.cesium-tabs :deep(.el-tabs__header) {
  position: sticky;
  top: 0;
  z-index: 2;
  margin: 0 0 14px;
  background: var(--color-bg-primary);
}

.cesium-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.cesium-tabs :deep(.el-tabs__item) {
  padding: 0 10px;
  font-size: 13px;
}

.tab-pane-content {
  padding: 2px 2px 12px;
}

.tab-section-title {
  display: flex;
  align-items: center;
  height: 28px;
  margin: 4px 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tab-section-title:not(:first-child) {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.camera-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}

.camera-grid :deep(.el-form-item) {
  margin-bottom: 12px;
}

.switch-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}

.switch-grid.small {
  grid-template-columns: 1fr;
}

.switch-grid :deep(.el-form-item) {
  margin-bottom: 10px;
}

.layer-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  background: var(--el-fill-color-blank);
  transition: border-color 0.3s;
}

.layer-card:hover {
  border-color: var(--el-color-primary-light-5);
}

.layer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.layer-body :deep(.el-form-item) {
  margin-bottom: 8px;
}

.layer-body :deep(.el-form-item__label) {
  font-size: 12px;
}

.empty-hint {
  text-align: center;
  padding: 16px 0;
}
</style>
