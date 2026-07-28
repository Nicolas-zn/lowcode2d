<template>
    <div class="data-filter-config">
        <!-- 过滤条件 -->
        <div class="config-section">
            <div class="section-header">
                <el-switch v-model="localFilters.enabled" active-text="启用数据过滤" />
                <el-tooltip content="根据条件筛选数据" placement="top">
                    <el-icon class="help-icon">
                        <QuestionFilled />
                    </el-icon>
                </el-tooltip>
            </div>

            <template v-if="localFilters.enabled">
                <div class="filter-logic">
                    <span class="logic-label">逻辑关系：</span>
                    <el-radio-group v-model="localFilters.logic" size="small">
                        <el-radio-button value="and">满足全部条件 (AND)</el-radio-button>
                        <el-radio-button value="or">满足任一条件 (OR)</el-radio-button>
                    </el-radio-group>
                </div>

                <div class="conditions-container">
                    <div class="conditions-header">
                        <el-button type="primary" size="small" @click="addCondition">
                            <el-icon>
                                <Plus />
                            </el-icon>
                            添加条件
                        </el-button>
                    </div>

                    <el-empty v-if="localFilters.conditions.length === 0" description="暂无过滤条件" :image-size="48" />

                    <div v-for="(condition, index) in localFilters.conditions" :key="index" class="condition-item">
                        <div class="condition-row">
                            <el-input v-model="condition.field" placeholder="字段名" size="small" style="width: 150px;" />
                            <el-select v-model="condition.operator" placeholder="操作符" size="small"
                                style="width: 130px;">
                                <el-option-group label="比较">
                                    <el-option label="等于" value="eq" />
                                    <el-option label="不等于" value="neq" />
                                    <el-option label="大于" value="gt" />
                                    <el-option label="大于等于" value="gte" />
                                    <el-option label="小于" value="lt" />
                                    <el-option label="小于等于" value="lte" />
                                    <el-option label="在范围内" value="between" />
                                </el-option-group>
                                <el-option-group label="文本">
                                    <el-option label="包含" value="contains" />
                                    <el-option label="不包含" value="notContains" />
                                    <el-option label="开头是" value="startsWith" />
                                    <el-option label="结尾是" value="endsWith" />
                                    <el-option label="正则匹配" value="regex" />
                                </el-option-group>
                                <el-option-group label="空值">
                                    <el-option label="为空" value="isEmpty" />
                                    <el-option label="不为空" value="isNotEmpty" />
                                </el-option-group>
                                <el-option-group label="列表">
                                    <el-option label="在列表中" value="in" />
                                    <el-option label="不在列表中" value="notIn" />
                                </el-option-group>
                            </el-select>
                            <el-input v-if="!['isEmpty', 'isNotEmpty'].includes(condition.operator)"
                                v-model="condition.value" :placeholder="getValuePlaceholder(condition.operator)"
                                size="small" style="flex: 1;" />
                            <el-button type="danger" size="small" :icon="Delete" circle
                                @click="removeCondition(index)" />
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <el-divider />

        <!-- 排序规则 -->
        <div class="config-section">
            <div class="section-header">
                <el-switch v-model="localSorting.enabled" active-text="启用数据排序" />
                <el-tooltip content="按指定字段对数据进行排序" placement="top">
                    <el-icon class="help-icon">
                        <QuestionFilled />
                    </el-icon>
                </el-tooltip>
            </div>

            <template v-if="localSorting.enabled">
                <div class="sorting-container">
                    <div class="sorting-header">
                        <el-button type="primary" size="small" @click="addSortRule">
                            <el-icon>
                                <Plus />
                            </el-icon>
                            添加排序
                        </el-button>
                    </div>

                    <el-empty v-if="localSorting.rules.length === 0" description="暂无排序规则" :image-size="48" />

                    <div class="sort-rules-list">
                        <div v-for="(rule, index) in localSorting.rules" :key="index" class="sort-item">
                            <div class="sort-order-buttons">
                                <el-button size="small" :icon="Top" circle :disabled="index === 0"
                                    @click="moveSortRule(index, -1)" />
                                <el-button size="small" :icon="Bottom" circle
                                    :disabled="index === localSorting.rules.length - 1"
                                    @click="moveSortRule(index, 1)" />
                            </div>
                            <el-input v-model="rule.field" placeholder="字段名" size="small" style="width: 180px;" />
                            <el-select v-model="rule.order" size="small" style="width: 100px;">
                                <el-option label="升序 ↑" value="asc" />
                                <el-option label="降序 ↓" value="desc" />
                            </el-select>
                            <el-button type="danger" size="small" :icon="Delete" circle
                                @click="removeSortRule(index)" />
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Plus, Delete, QuestionFilled, Top, Bottom } from '@element-plus/icons-vue'

const props = defineProps({
    filters: {
        type: Object,
        default: () => ({
            enabled: false,
            conditions: [],
            logic: 'and'
        })
    },
    sorting: {
        type: Object,
        default: () => ({
            enabled: false,
            rules: []
        })
    }
})

const emit = defineEmits(['update:filters', 'update:sorting'])

const localFilters = ref({
    enabled: props.filters?.enabled || false,
    conditions: props.filters?.conditions || [],
    logic: props.filters?.logic || 'and'
})

const localSorting = ref({
    enabled: props.sorting?.enabled || false,
    rules: props.sorting?.rules || []
})

// 同步过滤配置
watch(localFilters, (newVal) => {
    emit('update:filters', newVal)
}, { deep: true })

// 同步排序配置
watch(localSorting, (newVal) => {
    emit('update:sorting', newVal)
}, { deep: true })

// 监听外部变化
watch(() => props.filters, (newVal) => {
    if (newVal) {
        localFilters.value = {
            enabled: newVal.enabled || false,
            conditions: newVal.conditions || [],
            logic: newVal.logic || 'and'
        }
    }
}, { deep: true })

watch(() => props.sorting, (newVal) => {
    if (newVal) {
        localSorting.value = {
            enabled: newVal.enabled || false,
            rules: newVal.rules || []
        }
    }
}, { deep: true })

// 获取值占位符
const getValuePlaceholder = (operator) => {
    switch (operator) {
        case 'in':
        case 'notIn':
            return '值1, 值2, 值3'
        case 'between':
            return '最小值, 最大值'
        case 'regex':
            return '正则表达式'
        default:
            return '比较值'
    }
}

// 添加过滤条件
const addCondition = () => {
    localFilters.value.conditions.push({
        field: '',
        operator: 'eq',
        value: ''
    })
}

// 删除过滤条件
const removeCondition = (index) => {
    localFilters.value.conditions.splice(index, 1)
}

// 添加排序规则
const addSortRule = () => {
    localSorting.value.rules.push({
        id: Date.now(),
        field: '',
        order: 'asc'
    })
}

// 删除排序规则
const removeSortRule = (index) => {
    localSorting.value.rules.splice(index, 1)
}

// 移动排序规则
const moveSortRule = (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= localSorting.value.rules.length) return
    const rules = localSorting.value.rules
    const temp = rules[index]
    rules[index] = rules[newIndex]
    rules[newIndex] = temp
}
</script>

<style scoped>
.data-filter-config {
    padding: 16px;
}

.config-section {
    margin-bottom: 16px;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.help-icon {
    color: var(--el-text-color-secondary);
    cursor: help;
}

.filter-logic {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.logic-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

.conditions-container,
.sorting-container {
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    padding: 16px;
}

.conditions-header,
.sorting-header {
    margin-bottom: 16px;
}

.condition-item {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
}

.condition-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sort-rules-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sort-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 12px;
}

.sort-order-buttons {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sort-order-buttons .el-button {
    padding: 4px;
    width: 24px;
    height: 24px;
}
</style>
