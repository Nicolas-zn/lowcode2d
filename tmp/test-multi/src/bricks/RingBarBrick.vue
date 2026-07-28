<template>
    <div class="ring-bar-brick">
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
    data: {
        type: Array,
        default: () => [
            { value: 40, name: '玫瑰1' },
            { value: 38, name: '玫瑰2' },
            { value: 32, name: '玫瑰3' },
            { value: 30, name: '玫瑰4' },
            { value: 28, name: '玫瑰5' },
            { value: 26, name: '玫瑰6' },
            { value: 22, name: '玫瑰7' },
            { value: 18, name: '玫瑰8' }
        ]
    },
    roseType: {
        type: String,
        default: 'radius' // 'radius' or 'area'
    },
    chartOption: {
        type: Array,
        default: () => []
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
// 使用 API 数据或默认数据，并应用chartOption颜色
const actualData = computed(() => {
    let data = props.data

    if (apiData.value) {
        if (Array.isArray(apiData.value)) {
            data = apiData.value
        } else if (apiData.value.data && Array.isArray(apiData.value.data.data)) {
            data = apiData.value.data.data
        }
    }

    // 应用chartOption的颜色配置
    if (data && props.chartOption && Array.isArray(props.chartOption)) {
        data = data.map((item, index) => {
            let option = null
            if (item.name) {
                option = props.chartOption.find(opt => opt.field && opt.field === item.name)
            }
            if (!option && item.name) {
                option = props.chartOption.find(opt => !opt.field && opt.name === item.name)
            }
            if (!option) {
                option = props.chartOption[index]
            }

            return {
                ...item,
                name: option?.name || item.name,
                itemStyle: {
                    color: option?.color || item.itemStyle?.color
                }
            }
        })
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

    // 根据主题设置边框颜色
    const borderColor = themeStore.isDark ? '#333' : '#fff'

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c} ({d}%)'
        },
        legend: {
            top: '5%',
            left: 'center'
        },
        series: [
            {
                name: '数据',
                type: 'pie',
                radius: [30, '70%'],
                center: ['50%', '60%'],
                roseType: props.roseType,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: borderColor,
                    borderWidth: 2
                },
                label: {
                    show: true,
                    formatter: '{b}: {d}%'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                data: actualData.value
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

watch(() => [props.data, props.roseType, actualData.value, themeStore.isDark], () => {
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
.ring-bar-brick {
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
