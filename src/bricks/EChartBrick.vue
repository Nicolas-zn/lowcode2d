<template>
    <div class="echart-brick">
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
import { useDataSourceData } from '../composables/useDataSourceData'
import { useThemeStore } from '../stores/themeStore'
import { colorPalettes } from '../assets/echartColorPalette'
import { applyOptionsToDataItems, resolveChartOptions } from '../utils/echartOptions'

const themeStore = useThemeStore()

const props = defineProps({
    chartType: {
        type: String,
        default: 'bar' // bar, line, pie
    },
    data: {
        type: Object,
        default: () => ({
            xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            series: [
                {
                    name: '销售额',
                    data: [120, 200, 150, 80, 70, 110, 130],
                    color: '#667eea'
                }
            ]
        })
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
    dataSourceId: {
        type: String,
        default: null
    },
    dataTransform: {
        type: Object,
        default: null
    },
    echartTheme: {
        type: String,
        default: '' // 空字符串表示使用默认主题
    },
    colorPalette: {
        type: String,
        default: '' // 调色盘
    }
})

// 使用 API 数据
const apiConfigRef = computed(() => props.apiConfig)
const { apiData } = useApiData(apiConfigRef)

// 使用数据源数据
const dataSourceIdRef = computed(() => props.dataSourceId)
const dataTransformRef = computed(() => props.dataTransform)
const { data: dataSourceData } = useDataSourceData(dataSourceIdRef, dataTransformRef)

// 计算实际标题：用户设置的 title 优先，否则使用数据源/API 返回的 title
const actualTitle = computed(() => {
    if (props.title) {
        return props.title
    }
    // 优先使用数据源数据
    if (dataSourceData.value && dataSourceData.value.data?.title) {
        return dataSourceData.value.data.title
    }
    if (apiData.value && apiData.value.data?.title) {
        return apiData.value.data.title
    }
    return ''
})

// 使用数据源、API 数据或默认数据，并应用chartOption配置
const actualData = computed(() => {
    let data = props.data

    // 优先使用数据源数据
    if (dataSourceData.value) {
        data = dataSourceData.value.data || dataSourceData.value
    }
    // 其次使用API数据
    else if (apiData.value) {
        data = apiData.value.data || apiData.value
    }

    // 应用chartOption的颜色配置到series
    if (data && data.series && props.chartOption && Array.isArray(props.chartOption)) {
        data = {
            ...data,
            series: data.series.map((apiSeries, index) => {
                // 字段映射优先级：
                // 1. 通过field精确匹配
                // 2. 通过name匹配  
                // 3. 通过索引匹配
                let option = null

                // 优先使用field字段匹配
                if (apiSeries.name) {
                    option = props.chartOption.find(opt => opt.field && opt.field === apiSeries.name)
                }

                // 如果field没匹配上，尝试name匹配
                if (!option && apiSeries.name) {
                    option = props.chartOption.find(opt => !opt.field && opt.name === apiSeries.name)
                }

                // 都没匹配上，使用索引
                if (!option) {
                    option = props.chartOption[index]
                }

                return {
                    ...apiSeries,
                    // 使用chartOption中的name（用户自定义的显示名称）
                    name: option?.name || apiSeries.name,
                    color: option?.color || apiSeries.color
                }
            })
        }
    }

    return data
})

const chartRef = ref(null)
let chartInstance = null

// 初始化图表
const initChart = () => {
    if (!chartRef.value) return

    // 销毁旧实例
    if (chartInstance) {
        chartInstance.dispose()
    }

    // 创建新实例，应用主题（空字符串表示默认主题，传 null 给 echarts）
    const theme = props.echartTheme || null
    chartInstance = echarts.init(chartRef.value, theme)

    // 根据图表类型生成配置
    const option = generateOption()
    chartInstance.setOption(option)
}

// 生成图表配置
const generateOption = () => {
    const dataToUse = actualData.value

    // 根据主题设置文本颜色
    const textColor = themeStore.isDark ? '#e8e8e8' : '#333333'
    const axisLineColor = themeStore.isDark ? '#4a4a4a' : '#d0d0d0'
    const splitLineColor = themeStore.isDark ? '#3a3a3a' : '#e0e0e0'

    const baseOption = {
        textStyle: {
            color: textColor
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            backgroundColor: themeStore.isDark ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: themeStore.isDark ? '#4a4a4a' : '#d0d0d0',
            textStyle: {
                color: textColor
            }
        },
        legend: {
            data: dataToUse.series.map(s => s.name),
            top: '5%',
            left: 'right',
            textStyle: {
                color: textColor
            }
        },
        grid: {
            left: '5%',
            right: '5%',
            bottom: '5%',
            top: '15%',
            containLabel: true
        }
    }

    // 如果选择了调色盘，添加到配置
    if (props.colorPalette && colorPalettes[props.colorPalette]) {
        baseOption.color = colorPalettes[props.colorPalette]
    }

    switch (props.chartType) {
        case 'bar':
            return {
                ...baseOption,
                xAxis: {
                    type: 'category',
                    data: dataToUse.xAxis,
                    axisLine: {
                        lineStyle: {
                            color: axisLineColor
                        }
                    },
                    axisLabel: {
                        color: textColor
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLine: {
                        lineStyle: {
                            color: axisLineColor
                        }
                    },
                    axisLabel: {
                        color: textColor
                    },
                    splitLine: {
                        lineStyle: {
                            color: splitLineColor
                        }
                    }
                },
                series: dataToUse.series.map(s => ({
                    name: s.name,
                    type: 'bar',
                    data: s.data,
                    // 调色盘优先，未选调色盘时使用用户自定义颜色
                    ...(!props.colorPalette && s.color && {
                        itemStyle: {
                            color: s.color
                        }
                    })
                }))
            }

        case 'line':
            return {
                ...baseOption,
                xAxis: {
                    type: 'category',
                    data: dataToUse.xAxis,
                    boundaryGap: false,
                    axisLine: {
                        lineStyle: {
                            color: axisLineColor
                        }
                    },
                    axisLabel: {
                        color: textColor
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLine: {
                        lineStyle: {
                            color: axisLineColor
                        }
                    },
                    axisLabel: {
                        color: textColor
                    },
                    splitLine: {
                        lineStyle: {
                            color: splitLineColor
                        }
                    }
                },
                series: dataToUse.series.map(s => ({
                    name: s.name,
                    type: 'line',
                    data: s.data,
                    smooth: true,
                    // 调色盘优先，未选调色盘时使用用户自定义颜色
                    ...(!props.colorPalette && s.color && {
                        itemStyle: {
                            color: s.color
                        },
                        lineStyle: {
                            color: s.color
                        }
                    })
                }))
            }

        case 'pie':
            const pieData = dataToUse.series[0]?.data || []
            const resolvedPieData = props.colorPalette
                ? applyOptionsToDataItems(pieData, resolveChartOptions(pieData, props.chartOption, props.colorPalette))
                : pieData

            return {
                textStyle: {
                    color: textColor
                },
                ...(props.colorPalette && colorPalettes[props.colorPalette] && {
                    color: colorPalettes[props.colorPalette]
                }),
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: {c} ({d}%)',
                    backgroundColor: themeStore.isDark ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: themeStore.isDark ? '#4a4a4a' : '#d0d0d0',
                    textStyle: {
                        color: textColor
                    }
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    data: dataToUse.series[0]?.data.map(item => item.name) || [],
                    textStyle: {
                        color: textColor
                    }
                },
                series: [
                    {
                        name: dataToUse.series[0]?.name || '数据',
                        type: 'pie',
                        radius: '50%',
                        data: resolvedPieData,
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            }

        default:
            return baseOption
    }
}

// 监听数据变化、主题变化、图表主题变化和调色盘变化
watch(() => [props.data, props.chartType, props.echartTheme, props.colorPalette, themeStore.isDark, actualData.value], () => {
    nextTick(() => {
        initChart()
    })
}, { deep: true })

// 窗口大小变化时重新渲染
const handleResize = () => {
    if (chartInstance) {
        chartInstance.resize()
    }
}

// ResizeObserver 实例
let resizeObserver = null

onMounted(() => {
    nextTick(() => {
        initChart()

        // 使用 ResizeObserver 监听容器大小变化
        if (chartRef.value && chartRef.value.parentElement) {
            resizeObserver = new ResizeObserver(() => {
                handleResize()
            })
            // 监听父容器（moveable 的容器）
            resizeObserver.observe(chartRef.value.parentElement)
        }
    })
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)

    // 清理 ResizeObserver
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
.echart-brick {
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
