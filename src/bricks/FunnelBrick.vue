<template>
    <div class="funnel-brick">
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
    title: {
        type: String,
        default: ''
    },
    data: {
        type: Array,
        default: () => [
            { value: 100, name: '访问' },
            { value: 80, name: '咨询' },
            { value: 60, name: '订单' },
            { value: 40, name: '点击' },
            { value: 20, name: '成交' }
        ]
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
            formatter: '{a} <br/>{b} : {c}'
        },
        legend: {
            top: '5%',
            left: 'center'
        },
        series: [
            {
                name: '漏斗图',
                type: 'funnel',
                left: '10%',
                top: '20%',
                bottom: '10%',
                width: '80%',
                min: 0,
                max: 100,
                minSize: '0%',
                maxSize: '100%',
                sort: 'descending',
                gap: 2,
                label: {
                    show: true,
                    position: 'inside',
                    fontSize: 14
                },
                labelLine: {
                    length: 10,
                    lineStyle: {
                        width: 1,
                        type: 'solid'
                    }
                },
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 1
                },
                emphasis: {
                    label: {
                        fontSize: 16
                    }
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
.funnel-brick {
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
