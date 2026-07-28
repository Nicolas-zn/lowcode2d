<template>
    <div class="echart-editor">
        <!-- EChart主题选择 -->
        <el-divider>主题配置</el-divider>
        <!-- <div class="theme-selector">
            <el-select 
              :model-value="echartTheme" 
              @update:model-value="$emit('update:echartTheme', $event)"
              placeholder="选择主题" 
              size="small" 
              clearable
            >
                <el-option 
                  v-for="theme in availableThemes" 
                  :key="theme.value"
                  :label="theme.label" 
                  :value="theme.value"  
                />
            </el-select>
        </div> -->

        <!-- 调色盘选择 -->
        <div class="palette-selector">
            <label class="palette-label">调色盘：</label>
            <el-select 
              :model-value="colorPalette" 
              @update:model-value="$emit('update:colorPalette', $event)"
              placeholder="选择调色盘" 
              size="small" 
              clearable
            >
                <el-option 
                  v-for="palette in colorPaletteOptions" 
                  :key="palette.value"
                  :label="palette.label" 
                  :value="palette.value"  
                />
            </el-select>
        </div>

        <!-- EChart个性化配置 - 所有类型通用 -->
        <template v-if="componentType && localProps.chartOption">
            <el-divider>样式配置</el-divider>
            <div v-for="(option, index) in localProps.chartOption" :key="index" class="item-row">
                <el-input
                    :model-value="option.name"
                    @update:model-value="(val) => updateOptionName(index, val)"
                    placeholder="系列名称"
                    size="small"
                    class="item-input"
                />
                <el-color-picker
                    :model-value="option.color"
                    @update:model-value="(val) => updateOptionColor(index, val)"
                    show-alpha
                    size="small"
                />
            </div>
        </template>

        <!-- 如果没有chartOption，显示提示 -->
        <el-empty v-else description="暂无配置项" :image-size="60" />
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { useApiData } from '../composables/useApiData'
import { getAvailableThemes } from '../utils/echartThemes'
import { getColorPaletteOptions } from '../assets/echartColorPalette'
import { applyChartPalette, createChartOptionsFromData } from '../utils/echartOptions'

const availableThemes = getAvailableThemes()
const colorPaletteOptions = getColorPaletteOptions()


const props = defineProps({
    modelValue: {
        type: Object,
        required: true
    },
    echartTheme: {
        type: String,
        default: ''
    },
    colorPalette: {
        type: String,
        default: ''
    },
    component: {
        type: Object,
        required: false
    },
    componentType: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['update:modelValue', 'update:echartTheme', 'update:colorPalette'])

// 获取API数据
const apiConfigRef = computed(() => props.component?.api)
const { apiData } = useApiData(apiConfigRef)

// 从API数据中获取title
const apiTitle = computed(() => {
    if (apiData.value) {
        // 支持多种数据格式
        return apiData.value.data?.title || apiData.value.title || ''
    }
    return ''
})

// 更新title映射
const updateTitleMapping = (value) => {
    emit('update:modelValue', {
        ...props.modelValue,
        titleMapping: value
    })
}

// 缓存上次的结果，避免不必要的更新
let lastPropsData = null
let lastApiDataHash = null

const getApiDataContent = () => {
    if (!apiData.value) return null
    return apiData.value.data?.data || apiData.value.data || apiData.value
}

const getChartDataSource = (propsData) => {
    return getApiDataContent() || propsData.data || props.component?.props?.data || null
}

const buildPropsWithChartOptions = () => {
    const propsData = JSON.parse(JSON.stringify(props.modelValue || {}))
    const chartData = getChartDataSource(propsData)
    const generatedOptions = createChartOptionsFromData(chartData, propsData.chartOption || [])

    if (generatedOptions.length) {
        propsData.chartOption = props.colorPalette
            ? applyChartPalette(generatedOptions, props.colorPalette)
            : generatedOptions
    } else if (!Array.isArray(propsData.chartOption)) {
        propsData.chartOption = []
    }

    return propsData
}

// 使用computed实现双向绑定，避免watch循环
const localProps = computed({
    get() {
        // 计算 apiData 的 hash 用于变化检测
        const currentApiDataHash = apiData.value ? JSON.stringify(apiData.value) : null

        // 如果 apiData 没变且有缓存，直接返回缓存
        if (lastPropsData && lastApiDataHash === currentApiDataHash &&
            JSON.stringify(props.modelValue) === JSON.stringify(lastPropsData)) {
            return lastPropsData
        }

        lastApiDataHash = currentApiDataHash
        const propsData = buildPropsWithChartOptions()

        // 缓存结果
        lastPropsData = propsData
        return propsData
    },
    set(value) {
        // 清理chartOption：移除没有field和name为默认值的配置
        if (value.chartOption && Array.isArray(value.chartOption)) {
            value.chartOption = value.chartOption.filter(opt => {
                // 保留有效的配置：
                // 1. 有field字段的
                // 2. 或者name不是默认的"数据X"格式的
                return opt.field || !opt.name.match(/^数据\d+$/)
            })
        }

        // 检查是否真的有变化，避免不必要的emit
        const hasChanged = JSON.stringify(value) !== JSON.stringify(lastPropsData)
        if (hasChanged) {
            emit('update:modelValue', value)
        }
    }
})

// 更新选项名称
const updateOptionName = (index, value) => {
    const newProps = JSON.parse(JSON.stringify(localProps.value))
    if (newProps.chartOption && newProps.chartOption[index]) {
        newProps.chartOption[index].name = value
        localProps.value = newProps
    }
}

// 更新选项颜色
const updateOptionColor = (index, value) => {
    const newProps = JSON.parse(JSON.stringify(localProps.value))
    if (newProps.chartOption && newProps.chartOption[index]) {
        newProps.chartOption[index].color = value
        localProps.value = newProps
    }
}

// 初始化itemStyle（用于饼图、漏斗图、环形柱状图）
const initItemStyle = (item) => {
    if (!item.itemStyle) {
        item.itemStyle = { color: '#5470c6' }
    }
    return item.itemStyle
}

// 监听调色盘变化
watch(() => props.colorPalette, (newPalette) => {
    const nextProps = buildPropsWithChartOptions()
    nextProps.chartOption = applyChartPalette(nextProps.chartOption || [], newPalette)
    emit('update:modelValue', nextProps)
})
</script>

<style scoped>
.echart-editor {
    width: 100%;
}

.theme-selector {
    padding: 0 12px;
    margin-bottom: 8px;
}

.theme-selector :deep(.el-select) {
    width: 100%;
}

.palette-selector {
    padding: 0 12px;
    margin-bottom: 16px;
}

.palette-label {
    display: block;
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-bottom: 6px;
}

.palette-selector :deep(.el-select) {
    width: 100%;
}

.item-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    margin-bottom: 8px;
    background: var(--color-bg-tertiary);
    border-radius: 6px;
    transition: all 0.3s ease;
}

.item-row:hover {
    background: var(--color-bg-secondary);
}

.item-input {
    flex: 1;
    min-width: 0;
}


:deep(.el-divider__text) {
    font-weight: 600;
    color: #303133;
    font-size: 13px;
}

:deep(.el-divider) {
    margin: 16px 0 12px 0;
}

.title-config {
    padding: 0 12px;
    margin-bottom: 16px;
}

.config-label {
    display: block;
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-bottom: 6px;
}

.title-hint {
    margin-top: 4px;
}

.hint-text {
    font-size: 11px;
    color: var(--color-text-tertiary);
}
</style>
