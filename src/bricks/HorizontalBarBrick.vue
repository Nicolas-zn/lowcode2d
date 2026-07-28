<template>
    <div class="horizontal-bar-brick">
        <!-- 标题栏 -->
        <div v-if="actualTitle" class="chart-header">
            <h3 class="chart-title">{{ actualTitle }}</h3>
        </div>

        <div ref="chartRef" class="chart-container"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { useApiData } from '../composables/useApiData'
import { useThemeStore } from '../stores/themeStore'
import { applyOptionsToSeries, resolveChartOptions } from '../utils/echartOptions'

const themeStore = useThemeStore()

const props = defineProps({
    title: {
        type: String,
        default: ''
    },
    data: {
        type: Object,
        default: () => ({
            yAxis: ['产品A', '产品B', '产品C', '产品D', '产品E'],
            series: [
                {
                    name: '销量',
                    data: [320, 302, 301, 334, 390],
                    color: '#5470c6'
                }
            ]
        })
    },
    chartOption: {
        type: Array,
        default: () => []
    },
    apiConfig: {
        type: Object,
        default: null
    },
    colorPalette: {
        type: String,
        default: ''
    }
})

// 使用 API 数据
const apiConfigRef = computed(() => props.apiConfig)
const { apiData } = useApiData(apiConfigRef)
// 计算实际标题：用户设置的 title 优先，否则使用 API 返回的 title
const actualTitle = computed(() => {
    if (props.title) {
        return props.title
    }
    if (apiData.value && apiData.value.data?.title) {
        return apiData.value.data.title
    }
    return ''
})
// 使用 API 数据或默认数据，并应用chartOption颜色
const actualData = computed(() => {
    let data = props.data

    if (apiData.value) {
        if (apiData.value.data) {
            data = apiData.value.data
        } else {
            data = apiData.value
        }
    }

    // 应用chartOption和调色盘配置到series
    if (data && data.series) {
        data = {
            ...data,
            series: applyOptionsToSeries(data.series, resolveChartOptions(data, props.chartOption, props.colorPalette))
        }
    }

    return data
})

const chartRef = ref(null)
let chartInstance = null
let resizeObserver = null

const initChart = () => {
    if (!chartRef.value) return

    if (chartInstance) {
        chartInstance.dispose()
    }

    // 根据全局主题自动选择：暗色模式用 'dark'，亮色模式用默认主题
    const theme = themeStore.isDark ? 'dark' : null
    chartInstance = echarts.init(chartRef.value, theme)

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: actualData.value.series.map(s => s.name),
            top: '5%',
            left: 'right'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            boundaryGap: [0, 0.01]
        },
        yAxis: {
            type: 'category',
            data: actualData.value.yAxis
        },
        series: actualData.value.series.map(s => ({
            name: s.name,
            type: 'bar',
            data: s.data,
            itemStyle: {
                color: s.color || undefined
            }
        }))
    }

    // 设置透明背景，让组件容器的背景色生效
    option.backgroundColor = 'transparent'
    chartInstance.setOption(option)
}

const handleResize = () => {
    if (chartInstance) {
        chartInstance.resize()
    }
}

watch(() => [props.data, props.chartOption, props.colorPalette, actualData.value, themeStore.isDark], () => {
    nextTick(() => {
        initChart()
    })
}, { deep: true })

onMounted(() => {
    nextTick(() => {
        initChart()

        if (chartRef.value && chartRef.value.parentElement) {
            resizeObserver = new ResizeObserver(() => {
                handleResize()
            })
            resizeObserver.observe(chartRef.value.parentElement)
        }
    })
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)

    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }

    if (chartInstance) {
        chartInstance.dispose()
    }
})
</script>

<style scoped>
.horizontal-bar-brick {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-primary);
    border-radius: 4px;
    overflow: hidden;
}





.chart-container {
    flex: 1;
    width: 100%;
    min-height: 200px;
    padding: 3%;
}
</style>
