<template>
    <div class="radar-brick">
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
            indicator: [
                { "name": "销售", "max": 100 },
                { "name": "管理", "max": 100 },
                { "name": "技术", "max": 100 },
                { "name": "客服", "max": 100 },
                { "name": "研发", "max": 100 }
            ],
            series: [
                {
                    name: "实际得分",
                    data: [85, 78, 92, 88, 90],
                    color: "#5470c6"
                },
                {
                    name: "目标得分",
                    data: [90, 85, 95, 92, 95],
                    color: "#91cc75"
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

    if (apiData.value && apiData.value.data) {
        data = apiData.value.data
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

    // 根据主题设置标签颜色
    const axisNameColor = themeStore.isDark ? '#ccc' : '#666'

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item'
        },
        legend: {
            data: actualData.value.series.map(s => s.name),
            top: '5%',
            left: 'center',
            textStyle: {
                fontSize: 12
            }
        },
        radar: {
            indicator: actualData.value.indicator,
            center: ['50%', '60%'],
            radius: '65%',
            splitNumber: 5,
            axisName: {
                color: axisNameColor,
                fontSize: 12
            },
            splitLine: {
                lineStyle: {
                    color: [
                        'rgba(238, 197, 102, 0.1)',
                        'rgba(238, 197, 102, 0.2)',
                        'rgba(238, 197, 102, 0.4)',
                        'rgba(238, 197, 102, 0.6)',
                        'rgba(238, 197, 102, 0.8)',
                        'rgba(238, 197, 102, 1)'
                    ].reverse()
                }
            },
            splitArea: {
                show: false
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(238, 197, 102, 0.5)'
                }
            }
        },
        series: [
            {
                type: 'radar',
                data: actualData.value.series.map(s => ({
                    value: s.data,
                    name: s.name,
                    itemStyle: {
                        color: s.color || undefined
                    },
                    areaStyle: {
                        opacity: 0.3
                    },
                    lineStyle: {
                        width: 2
                    },
                    symbol: 'circle',
                    symbolSize: 6
                }))
            }
        ]
    }

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
.radar-brick {
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
