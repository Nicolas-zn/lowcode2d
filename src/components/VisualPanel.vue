<template>
  <div class="visual-panel">
    <div class="visual-group">
      <div class="group-title">基础组件</div>
      <div class="visual-list">
        <el-card
          v-for="comp in baseItems"
          :key="comp.name"
          class="visual-item"
          shadow="hover"
          draggable="true"
          @dragstart="handleDragStart($event, comp)"
        >
          <div class="visual-content">
            <el-icon :size="32" :color="comp.color">
              <component :is="comp.icon" />
            </el-icon>
            <div class="visual-info">
              <div class="visual-name">{{ comp.name }}</div>
              <div class="visual-desc">{{ comp.desc }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <div class="visual-group">
      <el-collapse v-model="activeMapCategories" class="category-collapse">
        <el-collapse-item v-for="group in mapGroups" :key="group.key" :name="group.key">
          <template #title>
            <div class="category-header">
              <el-icon><LocationFilled /></el-icon>
              <span>{{ group.title }}</span>
              <el-tag size="small" type="info">{{ group.items.length }}</el-tag>
            </div>
          </template>

          <div class="visual-list">
            <el-card
              v-for="comp in group.items"
              :key="`${group.key}-${comp.name}`"
              class="visual-item"
              shadow="hover"
              draggable="true"
              @dragstart="handleDragStart($event, comp)"
            >
              <div class="visual-content">
                <el-icon :size="32" :color="comp.color">
                  <component :is="comp.icon" />
                </el-icon>
                <div class="visual-info">
                  <div class="visual-name">{{ comp.name }}</div>
                  <div class="visual-desc">{{ comp.desc }}</div>
                </div>
              </div>
            </el-card>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MapLocation, Box, LocationFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePanelStore } from '../stores/panelStore'
import demoCityMap from '../assets/maps/demo-city-map.json'

const panelStore = usePanelStore()
const activeMapCategories = ref(['general', 'special', 'network'])

const createMapPreset = (name, desc, overrides = {}) => ({
  type: 'EChartMapBrick',
  name,
  desc,
  icon: LocationFilled,
  color: '#17c0eb',
  defaultWidth: 760,
  defaultHeight: 520,
  defaultProps: {
    title: '全国态势地图',
    mapName: '全国态势',
    sourceType: 'china',
    presetMapCode: '100000',
    enableDrilldown: true,
    enableRegionSelect: true,
    selectedRegionVariable: 'selectedMapRegion',
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
    lineSymbolSize: 8,
    geoJson: { type: 'FeatureCollection', features: [] },
    regionData: [
      { name: '北京市', value: 92, adcode: '110000' },
      { name: '上海市', value: 89, adcode: '310000' },
      { name: '广东省', value: 96, adcode: '440000' },
      { name: '浙江省', value: 87, adcode: '330000' },
      { name: '四川省', value: 74, adcode: '510000' },
      { name: '湖北省', value: 68, adcode: '420000' }
    ],
    scatterData: [
      { name: '北京调度中心', value: [116.405285, 39.904989, 120] },
      { name: '上海枢纽', value: [121.472644, 31.231706, 98] },
      { name: '深圳业务中心', value: [114.057868, 22.543099, 108] }
    ],
    lineData: [
      { fromName: '北京', toName: '上海', coords: [[116.405285, 39.904989], [121.472644, 31.231706]], value: 88 },
      { fromName: '上海', toName: '深圳', coords: [[121.472644, 31.231706], [114.057868, 22.543099]], value: 79 }
    ],
    ...overrides
  }
})

const baseItems = [
  {
    type: 'CesiumBrick',
    name: 'Cesium',
    desc: 'GIS 3D地图',
    icon: MapLocation,
    color: '#409EFF',
    defaultWidth: 800,
    defaultHeight: 600,
    defaultProps: {
      cesiumConfig: {
        baseMap: 'tianditu_img',
        tiandituToken: 'b72aa81ac2b3571ffd1b5e82ea1eef6c',
        baseMapOpacity: 1,
        layers: [],
        camera: { longitude: 116.3912757, latitude: 39.906217, height: 15000000, heading: 0, pitch: -90, roll: 0 },
        models: [],
        markers: [],
        terrain: false,
        showTestEntities: true,
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
        routeHeight: 500,
        routePoints: [],
        routeStyle: {
          visible: true,
          color: '#67C23A',
          width: 4,
          clampToGround: false
        }
      }
    }
  },
  {
    type: 'ThreeJSBrick',
    name: 'Three.js',
    desc: '3D场景',
    icon: Box,
    color: '#67C23A',
    defaultWidth: 800,
    defaultHeight: 600,
    defaultProps: {}
  }
]

const mapGroups = [
  {
    key: 'general',
    title: '通用地图',
    items: [
      createMapPreset('ECharts地图', '基础专题地图'),
      createMapPreset('省域专题图', '省份业务分布', {
        title: '浙江业务专题',
        mapName: '浙江业务',
        sourceType: 'province',
        presetMapCode: '330000',
        enableDrilldown: false,
        zoom: 1.05,
        regionData: [
          { name: '杭州市', value: 96 },
          { name: '宁波市', value: 84 },
          { name: '温州市', value: 73 },
          { name: '嘉兴市', value: 66 },
          { name: '金华市', value: 70 }
        ],
        scatterData: [
          { name: '杭州主中心', value: [120.153576, 30.287459, 118] },
          { name: '宁波分拨', value: [121.549792, 29.868388, 92] },
          { name: '温州节点', value: [120.672111, 28.000575, 75] }
        ],
        lineData: [
          { fromName: '杭州', toName: '宁波', coords: [[120.153576, 30.287459], [121.549792, 29.868388]], value: 68 },
          { fromName: '杭州', toName: '温州', coords: [[120.153576, 30.287459], [120.672111, 28.000575]], value: 74 }
        ]
      })
    ]
  },
  {
    key: 'special',
    title: '专题地图',
    items: [
      createMapPreset('全国飞线图', '全国链路流向', {
        title: '全国物流飞线',
        mapName: '全国物流',
        areaColor: 'rgba(5,24,54,0.94)',
        emphasisAreaColor: '#36c2ff',
        borderColor: '#3dd6ff',
        scatterColor: '#ffdc5e',
        scatterShadowColor: '#ffdc5e',
        lineColor: '#42f5c8',
        lineWidth: 2.5,
        lineCurveness: 0.22,
        lineSymbolSize: 10,
        regionData: [
          { name: '北京市', value: 83, adcode: '110000' },
          { name: '陕西省', value: 69, adcode: '610000' },
          { name: '广东省', value: 98, adcode: '440000' },
          { name: '四川省', value: 76, adcode: '510000' },
          { name: '江苏省', value: 88, adcode: '320000' }
        ],
        scatterData: [
          { name: '北京总控', value: [116.405285, 39.904989, 110] },
          { name: '西安中转', value: [108.948024, 34.263161, 88] },
          { name: '广州港', value: [113.280637, 23.125178, 126] },
          { name: '成都仓', value: [104.065735, 30.659462, 92] }
        ],
        lineData: [
          { fromName: '北京', toName: '西安', coords: [[116.405285, 39.904989], [108.948024, 34.263161]], value: 76 },
          { fromName: '北京', toName: '广州', coords: [[116.405285, 39.904989], [113.280637, 23.125178]], value: 98 },
          { fromName: '西安', toName: '成都', coords: [[108.948024, 34.263161], [104.065735, 30.659462]], value: 64 },
          { fromName: '广州', toName: '成都', coords: [[113.280637, 23.125178], [104.065735, 30.659462]], value: 71 }
        ]
      }),
      createMapPreset('园区态势图', '园区/厂区示意', {
        title: '园区设备态势',
        mapName: '园区态势',
        sourceType: 'custom',
        enableDrilldown: false,
        geoJson: demoCityMap,
        zoom: 1.05,
        showVisualMap: false,
        areaColor: 'rgba(10,36,48,0.95)',
        emphasisAreaColor: '#00bcd4',
        borderColor: '#7ee7ff',
        borderWidth: 1.4,
        scatterColor: '#80ffea',
        scatterShadowColor: '#80ffea',
        lineColor: '#ffe066',
        lineWidth: 2,
        lineCurveness: 0.12,
        regionData: [
          { name: '核心区', value: 92 },
          { name: '东部新区', value: 76 },
          { name: '南部产业带', value: 68 },
          { name: '西部智造区', value: 58 },
          { name: '北部门户', value: 81 },
          { name: '临港片区', value: 89 }
        ],
        scatterData: [
          { name: '调度中心', value: [10, 8, 120] },
          { name: '物流枢纽', value: [39, 26, 86] },
          { name: '生产基地', value: [20, 24, 98] },
          { name: '安防哨点', value: [-6, 13, 62] }
        ],
        lineData: [
          { fromName: '调度中心', toName: '物流枢纽', coords: [[10, 8], [39, 26]], value: 88 },
          { fromName: '调度中心', toName: '生产基地', coords: [[10, 8], [20, 24]], value: 72 },
          { fromName: '生产基地', toName: '安防哨点', coords: [[20, 24], [-6, 13]], value: 54 }
        ]
      })
    ]
  },
  {
    key: 'network',
    title: '网络流向',
    items: [
      createMapPreset('枢纽网络图', '多节点网络地图', {
        title: '东部枢纽网络',
        mapName: '东部网络',
        showLabel: false,
        showScatterLabel: true,
        showVisualMap: false,
        areaColor: 'rgba(18,22,56,0.94)',
        emphasisAreaColor: '#7c5cff',
        borderColor: '#8ea2ff',
        scatterColor: '#ff7aa2',
        scatterShadowColor: '#ff7aa2',
        lineColor: '#7cf7ff',
        lineWidth: 1.8,
        lineCurveness: 0.28,
        lineSymbolSize: 9,
        regionData: [],
        scatterData: [
          { name: '北京', value: [116.405285, 39.904989, 102] },
          { name: '天津', value: [117.190182, 39.125596, 68] },
          { name: '青岛', value: [120.38264, 36.067082, 74] },
          { name: '上海', value: [121.472644, 31.231706, 110] },
          { name: '南京', value: [118.796877, 32.060255, 79] },
          { name: '杭州', value: [120.153576, 30.287459, 86] }
        ],
        lineData: [
          { fromName: '北京', toName: '天津', coords: [[116.405285, 39.904989], [117.190182, 39.125596]], value: 42 },
          { fromName: '北京', toName: '青岛', coords: [[116.405285, 39.904989], [120.38264, 36.067082]], value: 58 },
          { fromName: '上海', toName: '南京', coords: [[121.472644, 31.231706], [118.796877, 32.060255]], value: 63 },
          { fromName: '上海', toName: '杭州', coords: [[121.472644, 31.231706], [120.153576, 30.287459]], value: 67 },
          { fromName: '青岛', toName: '上海', coords: [[120.38264, 36.067082], [121.472644, 31.231706]], value: 72 }
        ]
      })
    ]
  }
]

const handleDragStart = (event, comp) => {
  const dragData = {
    source: 'visual-panel',
    type: comp.type,
    name: comp.name,
    defaultWidth: comp.defaultWidth,
    defaultHeight: comp.defaultHeight,
    defaultProps: comp.defaultProps || {}
  }
  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer.effectAllowed = 'copy'
}

const addVisualComponent = (comp) => {
  panelStore.addComponent({
    name: comp.name,
    type: comp.type,
    x: Math.floor(Math.random() * 200),
    y: Math.floor(Math.random() * 200),
    width: comp.defaultWidth,
    height: comp.defaultHeight,
    props: {
      title: comp.name,
      ...(comp.defaultProps ? JSON.parse(JSON.stringify(comp.defaultProps)) : {})
    }
  })
  ElMessage.success(`已添加 ${comp.name} 组件`)
}
</script>

<style scoped>
.visual-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.visual-group + .visual-group {
  margin-top: 18px;
}

.group-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.visual-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.visual-item {
  cursor: grab;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.visual-item:active {
  cursor: grabbing;
}

.visual-item:hover {
  transform: translateY(-2px);
}

.visual-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.visual-info {
  flex: 1;
}

.visual-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.visual-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.category-collapse {
  border: none;
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

.category-header .el-tag {
  margin-left: auto;
}

:deep(.category-collapse .el-collapse-item__wrap) {
  border: none;
}

:deep(.category-collapse .el-collapse-item__content) {
  padding: 0 0 12px 0;
}

:deep(.el-card__body) {
  padding: 12px;
}
</style>
