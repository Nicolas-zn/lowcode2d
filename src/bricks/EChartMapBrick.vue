<template>
  <div class="map-brick">
    <div v-if="actualTitle || canGoBack" class="map-header">
      <button v-if="canGoBack" class="back-button" @click="restoreRootMap">返回</button>
      <h3 v-if="actualTitle" class="map-title">{{ actualTitle }}</h3>
    </div>
    <div ref="chartRef" class="map-chart"></div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useApiData } from '../composables/useApiData'
import { useDataSourceData } from '../composables/useDataSourceData'
import { useThemeStore } from '../stores/themeStore'
import { useVariableStore } from '../stores/variableStore'
import { colorPalettes } from '../assets/echartColorPalette'
import { DEFAULT_CHINA_CODE, getPresetMapUrl, getProvinceLabelByCode } from '../utils/mapPresets'
import { globalEventBus } from '../core/GlobalEventBus'

const themeStore = useThemeStore()
const variableStore = useVariableStore()

const props = defineProps({
  title: { type: String, default: '' },
  mapName: { type: String, default: '地图组件' },
  sourceType: { type: String, default: 'custom' },
  presetMapCode: { type: String, default: DEFAULT_CHINA_CODE },
  enableDrilldown: { type: Boolean, default: true },
  enableRegionSelect: { type: Boolean, default: true },
  selectedRegionVariable: { type: String, default: 'selectedMapRegion' },
  geoJson: { type: Object, default: () => ({ type: 'FeatureCollection', features: [] }) },
  regionData: { type: Array, default: () => [] },
  scatterData: { type: Array, default: () => [] },
  lineData: { type: Array, default: () => [] },
  roam: { type: Boolean, default: true },
  showLabel: { type: Boolean, default: true },
  showVisualMap: { type: Boolean, default: true },
  showScatterLabel: { type: Boolean, default: true },
  zoom: { type: Number, default: 1.1 },
  labelOffsetY: { type: Number, default: 0 },
  areaColor: { type: String, default: 'rgba(16,36,63,0.95)' },
  emphasisAreaColor: { type: String, default: '#0b5cff' },
  borderColor: { type: String, default: '#2f7ef7' },
  borderWidth: { type: Number, default: 1.2 },
  scatterColor: { type: String, default: '#ffd166' },
  scatterShadowColor: { type: String, default: '#ffd166' },
  scatterMinSize: { type: Number, default: 10 },
  scatterMaxSize: { type: Number, default: 26 },
  lineColor: { type: String, default: '#00e5a8' },
  lineWidth: { type: Number, default: 2 },
  lineCurveness: { type: Number, default: 0.3 },
  lineSymbolSize: { type: Number, default: 8 },
  apiConfig: { type: Object, default: null },
  dataSourceId: { type: String, default: null },
  dataTransform: { type: Object, default: null },
  echartTheme: { type: String, default: '' },
  colorPalette: { type: String, default: '' }
})

const apiConfigRef = computed(() => props.apiConfig)
const { apiData } = useApiData(apiConfigRef)
const dataSourceIdRef = computed(() => props.dataSourceId)
const dataTransformRef = computed(() => props.dataTransform)
const { data: dataSourceData } = useDataSourceData(dataSourceIdRef, dataTransformRef)

const actualTitle = computed(() => {
  if (props.title) return props.title
  if (dataSourceData.value?.title) return dataSourceData.value.title
  if (dataSourceData.value?.data?.title) return dataSourceData.value.data.title
  if (apiData.value?.title) return apiData.value.title
  if (apiData.value?.data?.title) return apiData.value.data.title
  return ''
})

const externalData = computed(() => dataSourceData.value?.data || dataSourceData.value || apiData.value?.data || apiData.value || {})
const chartRef = ref(null)
const currentMapCode = ref(props.sourceType === 'province' ? props.presetMapCode : DEFAULT_CHINA_CODE)
const currentMapGeoJson = ref(props.geoJson)
const canGoBack = computed(() => props.enableDrilldown && props.sourceType === 'china' && currentMapCode.value !== DEFAULT_CHINA_CODE)

let chartInstance = null
let resizeObserver = null
let requestSeed = 0

const actualData = computed(() => ({
  regionData: externalData.value.regionData || props.regionData,
  scatterData: externalData.value.scatterData || props.scatterData,
  lineData: externalData.value.lineData || props.lineData
}))

const resolveMapCode = () => {
  if (props.sourceType === 'province') return props.presetMapCode || '330000'
  if (props.sourceType === 'china') return DEFAULT_CHINA_CODE
  return props.presetMapCode || DEFAULT_CHINA_CODE
}

const resolveMapName = () => {
  if (props.sourceType === 'province') return getProvinceLabelByCode(currentMapCode.value) || props.mapName || '省份地图'
  if (props.sourceType === 'china' && currentMapCode.value !== DEFAULT_CHINA_CODE) return getProvinceLabelByCode(currentMapCode.value) || '省份地图'
  return props.mapName || '地图组件'
}

const fetchGeoJson = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`地图数据加载失败: ${response.status}`)
  return response.json()
}

const ensureMapData = async () => {
  if (props.sourceType === 'custom') {
    currentMapGeoJson.value = externalData.value.geoJson || props.geoJson
    currentMapCode.value = props.presetMapCode || DEFAULT_CHINA_CODE
    return
  }

  const targetCode = currentMapCode.value || resolveMapCode()
  const seed = ++requestSeed
  const geoJson = await fetchGeoJson(getPresetMapUrl(targetCode))
  if (seed !== requestSeed) return
  currentMapGeoJson.value = geoJson
}

const registerCurrentMap = () => {
  const geoJson = currentMapGeoJson.value
  if (!geoJson?.features?.length) return false
  echarts.registerMap(resolveMapName(), geoJson)
  return true
}

const buildOption = () => {
  const textColor = themeStore.isDark ? '#dce7f5' : '#1f2a37'
  const palette = colorPalettes[props.colorPalette] || ['#0b5cff', '#32c5ff', '#00e5a8', '#ffd166', '#ff6b6b']
  const maxRegionValue = Math.max(...actualData.value.regionData.map(item => Number(item.value) || 0), 100)

  return {
    backgroundColor: 'transparent',
    color: palette,
    tooltip: {
      trigger: 'item',
      backgroundColor: themeStore.isDark ? 'rgba(7, 17, 33, 0.92)' : 'rgba(255, 255, 255, 0.96)',
      borderColor: themeStore.isDark ? '#24456b' : '#cfe0ff',
      textStyle: { color: textColor },
      formatter(params) {
        if (params.seriesType === 'lines') return `${params.data.fromName} -> ${params.data.toName}<br/>强度：${params.data.value ?? '-'}`
        if (Array.isArray(params.value)) return `${params.name}<br/>值：${params.value[2] ?? params.value[0] ?? '-'}`
        return `${params.name}<br/>值：${params.value ?? '-'}`
      }
    },
    visualMap: props.showVisualMap ? {
      min: 0,
      max: maxRegionValue,
      left: 16,
      bottom: 16,
      text: ['高', '低'],
      calculable: true,
      textStyle: { color: textColor },
      inRange: {
        color: [props.areaColor, palette[1] || palette[0], palette[0]]
      }
    } : undefined,
    geo: {
      map: resolveMapName(),
      roam: props.roam,
      zoom: props.zoom,
      label: {
        show: false
      }
    },
    series: [
      {
        type: 'map',
        map: resolveMapName(),
        roam: props.roam,
        zoom: props.zoom,
        label: {
          show: props.showLabel,
          color: textColor,
          fontSize: 12,
          offset: [0, props.labelOffsetY]
        },
        emphasis: {
          label: { color: '#ffffff' },
          itemStyle: { areaColor: props.emphasisAreaColor || palette[0] }
        },
        itemStyle: {
          areaColor: props.areaColor,
          borderColor: props.borderColor,
          borderWidth: props.borderWidth
        },
        data: actualData.value.regionData
      },
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        rippleEffect: { scale: 4, brushType: 'stroke' },
        symbolSize(value) {
          const raw = Number(value?.[2]) || props.scatterMinSize
          return Math.max(props.scatterMinSize, Math.min(props.scatterMaxSize, raw / 6))
        },
        label: {
          show: props.showScatterLabel,
          formatter: '{b}',
          position: 'top',
          color: textColor
        },
        itemStyle: {
          color: props.scatterColor,
          shadowBlur: 14,
          shadowColor: props.scatterShadowColor
        },
        data: actualData.value.scatterData
      },
      {
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 2,
        effect: {
          show: true,
          period: 5,
          symbol: 'arrow',
          symbolSize: props.lineSymbolSize,
          trailLength: 0.2
        },
        lineStyle: {
          color: props.lineColor,
          width: props.lineWidth,
          opacity: 0.8,
          curveness: props.lineCurveness
        },
        data: actualData.value.lineData
      }
    ]
  }
}

const bindDrilldown = () => {
  if (!chartInstance) return
  chartInstance.off('click')

  chartInstance.on('click', async (params) => {
    if (props.enableRegionSelect && params?.seriesType === 'map') {
      const feature = currentMapGeoJson.value?.features?.find(item => item?.properties?.name === params.name)
      const payload = {
        name: params.name,
        value: params.value,
        adcode: feature?.properties?.adcode || params?.data?.adcode || '',
        mapCode: currentMapCode.value,
        mapName: resolveMapName()
      }
      variableStore.setVariable(props.selectedRegionVariable || 'selectedMapRegion', payload.name)
      variableStore.setVariable(`${props.selectedRegionVariable || 'selectedMapRegion'}Info`, payload)
      globalEventBus.emit('map:regionSelected', payload)
    }

    if (!(props.enableDrilldown && props.sourceType === 'china')) return

    const targetCode = String(params?.data?.adcode || params?.data?.code || params?.data?.adCode || params?.event?.topTarget?.dataIndex || '')
    const feature = currentMapGeoJson.value?.features?.find(item => item?.properties?.name === params.name)
    const adcode = String(feature?.properties?.adcode || targetCode || '')
    if (!adcode || currentMapCode.value !== DEFAULT_CHINA_CODE) return

    try {
      currentMapCode.value = adcode
      await initChart()
    } catch (error) {
      currentMapCode.value = DEFAULT_CHINA_CODE
      console.error(error)
    }
  })
}

const initChart = async () => {
  if (!chartRef.value) return
  await ensureMapData()
  if (!registerCurrentMap()) return

  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value, props.echartTheme || null)
  chartInstance.setOption(buildOption())
  bindDrilldown()
}

const resizeChart = () => {
  if (chartInstance) chartInstance.resize()
}

const restoreRootMap = async () => {
  currentMapCode.value = DEFAULT_CHINA_CODE
  await initChart()
}

watch(
  () => [
    props.title,
    props.sourceType,
    props.presetMapCode,
    props.enableDrilldown,
    props.roam,
    props.showLabel,
    props.showVisualMap,
    props.showScatterLabel,
    props.zoom,
    props.labelOffsetY,
    props.areaColor,
    props.emphasisAreaColor,
    props.borderColor,
    props.borderWidth,
    props.scatterColor,
    props.scatterShadowColor,
    props.scatterMinSize,
    props.scatterMaxSize,
    props.lineColor,
    props.lineWidth,
    props.lineCurveness,
    props.lineSymbolSize,
    props.echartTheme,
    props.colorPalette,
    themeStore.isDark,
    props.geoJson,
    actualData.value
  ],
  async () => {
    if (props.sourceType !== 'china') {
      currentMapCode.value = resolveMapCode()
    } else if (!props.enableDrilldown) {
      currentMapCode.value = DEFAULT_CHINA_CODE
    }
    await nextTick()
    await initChart()
  },
  { deep: true }
)

onMounted(async () => {
  currentMapCode.value = resolveMapCode()
  await nextTick()
  await initChart()
  if (chartRef.value?.parentElement) {
    resizeObserver = new ResizeObserver(() => resizeChart())
    resizeObserver.observe(chartRef.value.parentElement)
  }
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (chartInstance) chartInstance.dispose()
})
</script>

<style scoped>
.map-brick {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top left, rgba(51, 137, 255, 0.18), transparent 35%),
    linear-gradient(160deg, rgba(7, 19, 39, 0.98), rgba(10, 34, 62, 0.94));
  border-radius: 4px;
  overflow: hidden;
}

.map-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px 0;
}

.back-button {
  border: 1px solid rgba(148, 198, 255, 0.35);
  background: rgba(13, 35, 64, 0.86);
  color: #d9ebff;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
}

.map-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #e8f3ff;
}

.map-chart {
  flex: 1;
  width: 100%;
  min-height: 220px;
}
</style>
