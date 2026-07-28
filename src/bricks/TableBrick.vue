<template>
    <div class="table-brick">
        <!-- 标题栏 -->
        <div v-if="actualTitle" class="table-header">
            <h3 class="table-title">{{ actualTitle }}</h3>
        </div>

        <div class="table-container">
            <el-table 
                :data="paginatedRows" 
                v-loading="loading"
                element-loading-text="加载中..."
                stripe
                border
                style="width: 100%"
                height="100%"
                :empty-text="'暂无数据'"
            >
                <el-table-column 
                    v-for="(column, index) in actualColumns" 
                    :key="index"
                    :prop="column"
                    :label="column"
                    :show-overflow-tooltip="true"
                >
                    <template #default="{ row }">
                        {{ row[column] || '-' }}
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 分页器 -->
        <div v-if="showPagination && actualRows.length > 0" class="pagination-wrapper">
            <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="currentPageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="actualRows.length"
                layout="total, sizes, prev, pager, next, jumper"
                background
                size="small"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useApiData } from '../composables/useApiData'
import { useDataSourceData } from '../composables/useDataSourceData'

const props = defineProps({
    title: {
        type: String,
        default: ''
    },
    columns: {
        type: Array,
        default: () => ['姓名', '年龄', '职位', '部门']
    },
    rows: {
        type: Array,
        default: () => [
            { '姓名': '张三', '年龄': 28, '职位': '工程师', '部门': '技术部' },
            { '姓名': '李四', '年龄': 32, '职位': '产品经理', '部门': '产品部' },
            { '姓名': '王五', '年龄': 25, '职位': '设计师', '部门': '设计部' },
            { '姓名': '赵六', '年龄': 30, '职位': '运营', '部门': '运营部' }
        ]
    },
    hiddenColumns: {
        type: Array,
        default: () => []
    },
    pageSize: {
        type: Number,
        default: 10
    },
    showPagination: {
        type: Boolean,
        default: true
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
    }
})

// 使用 API 数据
const apiConfigRef = computed(() => props.apiConfig)
const { apiData, loading: apiLoading } = useApiData(apiConfigRef)

// 使用数据源数据
const dataSourceIdRef = computed(() => props.dataSourceId)
const dataTransformRef = computed(() => props.dataTransform)
const { data: dataSourceData, loading: dataSourceLoading } = useDataSourceData(dataSourceIdRef, dataTransformRef)

// 合并加载状态
const loading = computed(() => apiLoading.value || dataSourceLoading.value)

// 使用数据源、API 数据或默认数据
const actualRows = computed(() => {
    // 优先使用数据源数据
    if (dataSourceData.value) {
        const data = dataSourceData.value.data?.rows || dataSourceData.value.rows || dataSourceData.value
        if (Array.isArray(data)) {
            return data
        }
    }
    
    // 其次使用 API 数据
    if (apiData.value) {
        const data = apiData.value.data?.rows || apiData.value.rows || apiData.value
        if (Array.isArray(data)) {
            return data
        }
    }
    
    // 最后使用默认 props
    return props.rows
})

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

// 获取所有列（未过滤）
const allColumns = computed(() => {
    // 优先使用数据源数据
    if (dataSourceData.value) {
        const data = dataSourceData.value.data?.columns || dataSourceData.value.columns
        if (Array.isArray(data)) {
            return data
        }
    }
    // 其次使用 API 数据
    if (apiData.value) {
        const data = apiData.value.data?.columns || apiData.value.columns
        if (Array.isArray(data)) {
            return data
        }
    }
    return props.columns
})

// 过滤隐藏的列
const actualColumns = computed(() => {
    return allColumns.value.filter(col => !props.hiddenColumns.includes(col))
})

// 当前页码
const currentPage = ref(1)

// 当前每页显示数量
const currentPageSize = ref(props.pageSize)

// 总页数
const totalPages = computed(() => {
    return Math.ceil(actualRows.value.length / currentPageSize.value) || 1
})

// 当前页显示的数据
const paginatedRows = computed(() => {
    if (!props.showPagination) {
        return actualRows.value
    }

    const start = (currentPage.value - 1) * currentPageSize.value
    const end = start + currentPageSize.value
    return actualRows.value.slice(start, end)
})

// 监听数据变化，重置到第一页
watch(() => actualRows.value.length, () => {
    currentPage.value = 1
})

// 监听 pageSize prop 变化
watch(() => props.pageSize, (newValue) => {
    currentPageSize.value = newValue
    currentPage.value = 1
})
</script>

<style scoped>
.table-brick {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color);
    border-radius: 4px;
    overflow: hidden;
}

.table-header {
    padding: 8px 16px;
    border-bottom: 2px solid var(--el-border-color-lighter);
}

.table-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.table-container {
    flex: 1;
    overflow: hidden;
    padding: 0;
}

/* 分页器样式 */
.pagination-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 16px;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-lighter);
}

/* 自定义 el-table 样式以匹配整体风格 */
:deep(.el-table) {
    font-size: 14px;
    --el-table-border-color: var(--el-border-color-lighter);
    --el-table-bg-color: var(--el-bg-color);
    --el-table-tr-bg-color: var(--el-bg-color);
    --el-table-header-bg-color: var(--el-fill-color-light);
}
</style>
