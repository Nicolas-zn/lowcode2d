<template>
    <div class="table-editor-inline">
        <!-- Excel 数据导入 -->
        <el-divider>本地数据注入</el-divider>
        <div class="import-section" style="padding: 0 12px; margin-bottom: 16px;">
            <el-button type="primary" @click="triggerFileInput" size="small" style="width: 100%;">
                <el-icon style="margin-right: 4px;"><Upload /></el-icon>
                导入 Excel 渲染
            </el-button>
            <input type="file" ref="fileInput" accept=".xlsx, .xls, .csv" style="display: none" @change="handleFileUpload" />
        </div>

        <!-- 数据项配置 -->
        <el-divider>数据项显示配置</el-divider>
        <div class="columns-config" v-if="apiColumns.length > 0">
            <div v-for="(col, index) in apiColumns" :key="index" class="column-row">
                <span class="column-name">{{ col }}</span>
                <el-switch
                    :model-value="isColumnVisible(col)"
                    @update:model-value="(val) => toggleColumnVisibility(col, val)"
                    active-text="显示"
                    inactive-text="隐藏"
                    size="small"
                />
            </div>
        </div>
        <el-empty v-else description="暂无数据项，请先配置接口" :image-size="60" />
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { useApiData } from '../composables/useApiData'

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({ hiddenColumns: [] })
    },
    component: {
        type: Object,
        required: false
    }
})

const emit = defineEmits(['update:modelValue'])

// 获取 API 数据
const apiConfigRef = computed(() => props.component?.api)
const { apiData } = useApiData(apiConfigRef)

// 数据项列读取
const apiColumns = computed(() => {
    if (apiData.value && apiData.value.data?.columns) {
        return apiData.value.data.columns
    }
    // 支持从本地注入的数据列
    if (props.modelValue?.columns && props.modelValue.columns.length > 0) {
        return props.modelValue.columns
    }
    return []
})

// 判断列是否可见
const isColumnVisible = (col) => {
    const hiddenColumns = props.modelValue?.hiddenColumns || []
    return !hiddenColumns.includes(col)
}

// 切换列的显示/隐藏
const toggleColumnVisibility = (col, visible) => {
    let hiddenColumns = [...(props.modelValue?.hiddenColumns || [])]
    
    if (visible) {
        // 从隐藏列表中移除
        hiddenColumns = hiddenColumns.filter(c => c !== col)
    } else {
        // 添加到隐藏列表
        if (!hiddenColumns.includes(col)) {
            hiddenColumns.push(col)
        }
    }
    
    emit('update:modelValue', {
        ...props.modelValue,
        hiddenColumns
    })
}

// === EXCEL 导入逻辑 ===
const fileInput = ref(null)

const triggerFileInput = () => {
    if (fileInput.value) {
        fileInput.value.click()
    }
}

const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]
            
            // 转换为 JSON 数组
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
            
            if (json.length > 0) {
                // 提取所有列名
                const columns = Object.keys(json[0])
                
                // 更新组件 props
                emit('update:modelValue', {
                    ...props.modelValue,
                    columns: columns,
                    rows: json,
                    hiddenColumns: [] // 导入新数据时重置隐藏列
                })
                
                ElMessage.success('Excel 导入成功')
            } else {
                ElMessage.warning('Excel 文件内容为空')
            }
        } catch (error) {
            console.error('解析 Excel 失败:', error)
            ElMessage.error('解析 Excel 失败，请检查文件格式')
        }
        
        // 清空 input，允许重复上传同一个文件
        event.target.value = ''
    }
    reader.readAsArrayBuffer(file)
}
</script>

<style scoped>
.table-editor-inline {
    width: 100%;
}

.columns-config {
    padding: 0 12px;
}

.column-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    margin-bottom: 8px;
    background: var(--color-bg-tertiary, #f5f7fa);
    border-radius: 6px;
}

.column-name {
    font-size: 14px;
    color: var(--color-text-primary, #303133);
    font-weight: 500;
}

:deep(.el-divider__text) {
    font-weight: 600;
    color: #303133;
    font-size: 13px;
}

:deep(.el-switch) {
    --el-switch-on-color: #409eff;
    --el-switch-off-color: #dcdfe6;
}
</style>
