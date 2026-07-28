<template>
    <el-dialog v-model="dialogVisible" title="编辑表格" width="700px" :close-on-click-modal="false">
        <div class="table-editor">
            <!-- 标题配置 -->
            <div class="section">
                <h4>标题配置</h4>
                <el-input v-model="title" placeholder="请输入表格标题（可选）" clearable maxlength="50" show-word-limit />
            </div>

            <!-- 表头列表 -->
            <div class="section">
                <div class="section-header">
                    <h4>表头配置</h4>
                    <el-button type="primary" size="small" @click="addColumn">
                        <el-icon>
                            <Plus />
                        </el-icon>
                        添加列
                    </el-button>
                </div>

                <el-table :data="columns" border style="width: 100%">
                    <el-table-column label="表头名称" width="200">
                        <template #default="{ row, $index }">
                            <el-input v-model="columns[$index]" placeholder="请输入表头名称" />
                        </template>
                    </el-table-column>
                    <el-table-column label="字段名" width="200">
                        <template #default="{ row, $index }">
                            <el-input v-model="fieldMappings[$index]" placeholder="数据字段名" />
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="120" align="center">
                        <template #default="{ $index }">
                            <el-button type="danger" size="small" circle @click="removeColumn($index)"
                                :disabled="columns.length <= 1">
                                <el-icon>
                                    <Delete />
                                </el-icon>
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 预览 -->
            <div class="section">
                <h4>预览</h4>
                <el-table :data="previewData" border style="width: 100%">
                    <el-table-column v-for="(col, index) in columns" :key="index" :label="col"
                        :prop="fieldMappings[index]" />
                </el-table>
            </div>
        </div>

        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirm">确定</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    tableData: {
        type: Object,
        default: () => ({ columns: [], rows: [] })
    }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

// 使用 computed 来避免循环更新
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})
const title = ref('')
const columns = ref([])
const fieldMappings = ref([])

// 监听 modelValue 变化，初始化数据
watch(() => props.modelValue, (val) => {
    if (val && props.tableData) {
        // 初始化数据
        title.value = props.tableData.title || ''
        columns.value = [...(props.tableData.columns || [])]

        // 如果有数据行，从第一行推断字段映射
        if (props.tableData.rows && props.tableData.rows.length > 0) {
            const firstRow = props.tableData.rows[0]
            fieldMappings.value = columns.value.map(col => {
                // 查找匹配的字段名
                return Object.keys(firstRow).find(key => key === col) || col
            })
        } else {
            fieldMappings.value = [...columns.value]
        }
    }
})

// 添加列
const addColumn = () => {
    const newColName = `列${columns.value.length + 1}`
    columns.value.push(newColName)
    fieldMappings.value.push(newColName)
}

// 删除列
const removeColumn = (index) => {
    columns.value.splice(index, 1)
    fieldMappings.value.splice(index, 1)
}

// 预览数据
const previewData = computed(() => {
    if (!props.tableData.rows || props.tableData.rows.length === 0) {
        return [{ '预览': '暂无数据' }]
    }

    // 根据新的字段映射重新组织数据
    return props.tableData.rows.slice(0, 3).map(row => {
        const newRow = {}
        columns.value.forEach((col, index) => {
            const fieldName = fieldMappings.value[index]
            newRow[fieldName] = row[fieldName] || '-'
        })
        return newRow
    })
})

// 确认修改
const handleConfirm = () => {
    if (columns.value.length === 0) {
        ElMessage.warning('至少需要一列')
        return
    }

    // 检查是否有空的表头名称
    if (columns.value.some(col => !col || col.trim() === '')) {
        ElMessage.warning('表头名称不能为空')
        return
    }

    // 检查是否有空的字段名
    if (fieldMappings.value.some(field => !field || field.trim() === '')) {
        ElMessage.warning('字段名不能为空')
        return
    }

    // 重新组织数据行以匹配新的字段映射
    const newRows = props.tableData.rows.map(row => {
        const newRow = {}
        columns.value.forEach((col, index) => {
            const oldFieldName = Object.keys(row).find(key =>
                key === fieldMappings.value[index] ||
                key === columns.value[index]
            ) || fieldMappings.value[index]

            newRow[col] = row[oldFieldName] || row[fieldMappings.value[index]] || '-'
        })
        return newRow
    })

    emit('confirm', {
        title: title.value,
        columns: columns.value,
        rows: newRows
    })

    dialogVisible.value = false
    ElMessage.success('表格配置已更新')
}
</script>

<style scoped>
.table-editor {
    max-height: 600px;
    overflow-y: auto;
}

.section {
    margin-bottom: 24px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.section h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

:deep(.el-table) {
    font-size: 14px;
}

:deep(.el-input__inner) {
    font-size: 14px;
}
</style>
