<template>
    <div class="gauge-brick">
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

const themeStore = useThemeStore()

const props = defineProps({
    title: {
        type: String,
        default: ''
    },
    value: {
        type: Number,
        default: 75
    },
    min: {
        type: Number,
        default: 0
    },
    max: {
        type: Number,
        default: 100
    },
    unit: {
        type: String,
        default: ''
    },
    apiConfig: {
        type: Object,
        default: null
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
// 使用 API 数据或默认数据
const actualValue = computed(() => {
    if (apiData.value) {
        let value = apiData.value.data?.value
        if (value !== undefined) {
            // 如果是字符串类型的百分比（如 "60%"），转换为数字
            if (typeof value === 'string') {
                // 移除 % 符号并转换为数字
                value = parseFloat(value.replace('%', ''))
            }
            return value
        }
        if (typeof apiData.value === 'number') {
            return apiData.value
        }
    }
    return props.value
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
    const labelColor = themeStore.isDark ? '#e0e0e0' : '#464646'
    const titleColor = themeStore.isDark ? '#aaa' : '#999'

    const option = {
        backgroundColor: 'transparent',
        series: [
            {
                type: 'gauge',
                min: props.min,
                max: props.max,
                startAngle: 180,
                endAngle: 0,
                center: ['50%', '75%'],
                radius: '90%',
                splitNumber: 10,
                axisLine: {
                    lineStyle: {
                        width: 30,
                        color: [
                            [0.3, '#67e0e3'],
                            [0.7, '#37a2da'],
                            [1, '#fd666d']
                        ]
                    }
                },
                pointer: {
                    icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
                    length: '12%',
                    width: 20,
                    offsetCenter: [0, '-60%'],
                    itemStyle: {
                        color: 'auto'
                    }
                },
                axisTick: {
                    length: 12,
                    lineStyle: {
                        color: 'auto',
                        width: 2
                    }
                },
                splitLine: {
                    length: 20,
                    lineStyle: {
                        color: 'auto',
                        width: 5
                    }
                },
                axisLabel: {
                    color: labelColor,
                    fontSize: 14,
                    distance: -60,
                    formatter: function (value) {
                        return value
                    }
                },
                title: {
                    offsetCenter: [0, '-20%'],
                    fontSize: 16,
                    color: titleColor
                },
                detail: {
                    fontSize: 30,
                    offsetCenter: [0, '0%'],
                    valueAnimation: true,
                    formatter: function (value) {
                        return value + (props.unit || '')
                    },
                    color: 'auto'
                },
                data: [
                    {
                        value: actualValue.value,
                        name: ''
                    }
                ]
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

watch(() => [props.value, props.min, props.max, props.unit, actualValue.value, themeStore.isDark], () => {
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
.gauge-brick {
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
