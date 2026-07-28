<template>
    <div class="water-drop-brick">
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
import 'echarts-liquidfill'
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
        default: 0.65 // 0-1之间的值，表示百分比
    },
    color: {
        type: [String, Array],
        default: () => ['#294D99', '#156ACF', '#1598ED', '#45BDFF']
    },
    shape: {
        type: String,
        default: 'circle' // circle, rect, roundRect, triangle, diamond, pin, arrow
    },
    backgroundColor: {
        type: String,
        default: '#f0f0f0'
    },
    label: {
        type: Object,
        default: () => ({
            show: true,
            fontSize: 50,
            color: '#FFFFFF'
        })
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
        console.log(apiData.value);

        if (apiData.value.data.value !== undefined) {
            console.log(apiData.value.data.value);

            return apiData.value.data.value
        }
        // 如果 API 直接返回数字
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

    // 根据主题设置背景色
    const bgColor = themeStore.isDark ? '#1a1a1a' : props.backgroundColor
    const innerBgColor = themeStore.isDark ? '#2a2a2a' : '#ffffff'

    const option = {
        backgroundColor: 'transparent',
        series: [
            {
                type: 'liquidFill',
                data: [actualValue.value, actualValue.value * 0.95, actualValue.value * 0.9], // 多层水波
                radius: '85%',
                center: ['50%', '50%'],
                color: Array.isArray(props.color) ? props.color : [props.color],
                backgroundStyle: {
                    color: innerBgColor,
                    borderColor: props.color[0] || props.color,
                    borderWidth: 2,
                    shadowColor: 'rgba(0, 0, 0, 0.1)',
                    shadowBlur: 10
                },
                shape: props.shape,
                outline: {
                    show: true,
                    borderDistance: 4,
                    itemStyle: {
                        borderWidth: 3,
                        borderColor: props.color[0] || props.color,
                        shadowBlur: 15,
                        shadowColor: 'rgba(0, 0, 0, 0.15)'
                    }
                },
                label: {
                    show: props.label.show,
                    fontSize: props.label.fontSize,
                    fontWeight: 'bold',
                    color: props.label.color,
                    insideColor: props.label.color,
                    formatter: function (param) {
                        return (param.value * 100).toFixed(0) + '%'
                    }
                },
                itemStyle: {
                    opacity: 0.8,
                    shadowBlur: 0
                },
                emphasis: {
                    itemStyle: {
                        opacity: 1
                    }
                }
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

// 监听属性变化
watch(() => [props.value, props.color, props.shape, props.backgroundColor, props.label, actualValue.value, themeStore.isDark], () => {
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
.water-drop-brick {
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
