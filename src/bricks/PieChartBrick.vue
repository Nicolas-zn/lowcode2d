<template>
    <div class="pie-chart-brick">
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
import { applyOptionsToDataItems, resolveChartOptions } from '../utils/echartOptions'

const themeStore = useThemeStore()

const props = defineProps({
    data: {
        type: Array,
        default: () => [
            { value: 335, name: '产品A' },
            { value: 310, name: '产品B' },
            { value: 234, name: '产品C' },
            { value: 135, name: '产品D' },
            { value: 148, name: '产品E' }
        ]
    },
    title: {
        type: String,
        default: ''
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
    // 如果用户设置了 title，优先使用用户的
    if (props.title) {
        return props.title
    }
    // 否则使用 API 返回的 title
    if (apiData.value && apiData.value.data?.title) {
        return apiData.value.data.title
    }
    return ''
})
// 使用 API 数据或默认数据，并应用chartOption颜色
const actualData = computed(() => {
    let data = props.data
    
    if (apiData.value) {
        if (Array.isArray(apiData.value)) {
            data = apiData.value
        } else if (apiData.value.data.data && Array.isArray(apiData.value.data.data)) {
            data = apiData.value.data.data
        }
    }
    data = applyOptionsToDataItems(data, resolveChartOptions(data, props.chartOption, props.colorPalette))

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
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            top: '5%',
            left: 'center',
            icon: 'rect'
        },
        series: [
            {
                name: '数据',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '60%'],
                avoidLabelOverlap: false,
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 20,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: actualData.value
            }
        ]
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
.pie-chart-brick {
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
