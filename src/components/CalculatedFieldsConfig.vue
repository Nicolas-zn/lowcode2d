<template>
    <div class="calculated-fields-config">
        <div class="config-header">
            <span class="header-title">计算字段</span>
            <el-tooltip content="基于现有字段创建新的计算字段，支持数学运算和表达式" placement="top">
                <el-icon class="help-icon">
                    <QuestionFilled />
                </el-icon>
            </el-tooltip>
        </div>

        <div class="fields-container">
            <div class="fields-header">
                <el-button type="primary" size="small" @click="addField">
                    <el-icon>
                        <Plus />
                    </el-icon>
                    添加计算字段
                </el-button>
            </div>

            <el-empty v-if="localFields.length === 0" description="暂无计算字段" :image-size="48" />

            <div v-for="(field, index) in localFields" :key="index" class="field-item">
                <div class="field-row">
                    <div class="field-name">
                        <label class="field-label">字段名称</label>
                        <el-input v-model="field.name" placeholder="newField" size="small" />
                    </div>
                    <div class="field-expression">
                        <label class="field-label">表达式</label>
                        <el-input v-model="field.expression" placeholder="$.price * $.quantity" size="small">
                            <template #suffix>
                                <el-dropdown @command="insertFunction($event, field)">
                                    <el-icon class="insert-fn-icon">
                                        <More />
                                    </el-icon>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item command="Math.round($.value)">四舍五入</el-dropdown-item>
                                            <el-dropdown-item command="Math.floor($.value)">向下取整</el-dropdown-item>
                                            <el-dropdown-item command="Math.ceil($.value)">向上取整</el-dropdown-item>
                                            <el-dropdown-item command="Math.abs($.value)">绝对值</el-dropdown-item>
                                            <el-dropdown-item command="$.value.toFixed(2)">保留2位小数</el-dropdown-item>
                                            <el-dropdown-item divided
                                                command="$.str.toUpperCase()">转大写</el-dropdown-item>
                                            <el-dropdown-item command="$.str.toLowerCase()">转小写</el-dropdown-item>
                                            <el-dropdown-item command="$.str.trim()">去除空格</el-dropdown-item>
                                            <el-dropdown-item divided command="$.a + $.b">加法</el-dropdown-item>
                                            <el-dropdown-item command="$.a - $.b">减法</el-dropdown-item>
                                            <el-dropdown-item command="$.a * $.b">乘法</el-dropdown-item>
                                            <el-dropdown-item command="$.a / $.b">除法</el-dropdown-item>
                                            <el-dropdown-item command="$.a % $.b">取余</el-dropdown-item>
                                            <el-dropdown-item divided
                                                command="$.a > $.b ? '是' : '否'">条件判断</el-dropdown-item>
                                            <el-dropdown-item command="$.value || '默认值'">空值默认</el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </template>
                        </el-input>
                    </div>
                    <el-button type="danger" size="small" :icon="Delete" circle @click="removeField(index)" />
                </div>
                <div class="field-hint">
                    提示：使用 $ 访问当前数据对象，如 $.name、$.price * $.quantity
                </div>
            </div>
        </div>

        <el-divider />

        <div class="preset-section">
            <div class="preset-title">常用计算模板</div>
            <div class="preset-grid">
                <div class="preset-card" @click="applyPreset('profit')">
                    <div class="preset-icon">💰</div>
                    <div class="preset-name">利润计算</div>
                    <div class="preset-desc">收入 - 成本</div>
                </div>
                <div class="preset-card" @click="applyPreset('rate')">
                    <div class="preset-icon">📊</div>
                    <div class="preset-name">百分比</div>
                    <div class="preset-desc">数值转百分比</div>
                </div>
                <div class="preset-card" @click="applyPreset('fullname')">
                    <div class="preset-icon">👤</div>
                    <div class="preset-name">姓名拼接</div>
                    <div class="preset-desc">姓 + 名</div>
                </div>
                <div class="preset-card" @click="applyPreset('age')">
                    <div class="preset-icon">📅</div>
                    <div class="preset-name">年龄计算</div>
                    <div class="preset-desc">根据生日计算</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Plus, Delete, QuestionFilled, More } from '@element-plus/icons-vue'

const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['update:modelValue'])

const localFields = ref([...props.modelValue])

// 同步到父组件
watch(localFields, (newVal) => {
    emit('update:modelValue', newVal)
}, { deep: true })

// 监听外部变化
watch(() => props.modelValue, (newVal) => {
    localFields.value = [...(newVal || [])]
}, { deep: true })

// 添加计算字段
const addField = () => {
    localFields.value.push({
        name: '',
        expression: ''
    })
}

// 删除计算字段
const removeField = (index) => {
    localFields.value.splice(index, 1)
}

// 插入函数
const insertFunction = (template, field) => {
    field.expression = template
}

// 应用预设模板
const applyPreset = (type) => {
    switch (type) {
        case 'profit':
            localFields.value.push({
                name: 'profit',
                expression: '$.revenue - $.cost'
            })
            break
        case 'rate':
            localFields.value.push({
                name: 'percentage',
                expression: '($.value * 100).toFixed(2) + "%"'
            })
            break
        case 'fullname':
            localFields.value.push({
                name: 'fullName',
                expression: '$.firstName + " " + $.lastName'
            })
            break
        case 'age':
            localFields.value.push({
                name: 'age',
                expression: 'new Date().getFullYear() - new Date($.birthday).getFullYear()'
            })
            break
    }
}
</script>

<style scoped>
.calculated-fields-config {
    padding: 16px;
}

.config-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
}

.header-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.help-icon {
    color: var(--el-text-color-secondary);
    cursor: help;
}

.fields-container {
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    padding: 16px;
}

.fields-header {
    margin-bottom: 16px;
}

.field-item {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
}

.field-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
}

.field-name {
    flex: 0 0 150px;
}

.field-expression {
    flex: 1;
}

.field-label {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
}

.field-hint {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    margin-top: 8px;
}

.insert-fn-icon {
    cursor: pointer;
    color: var(--el-text-color-secondary);
}

.insert-fn-icon:hover {
    color: var(--el-color-primary);
}

.preset-section {
    margin-top: 16px;
}

.preset-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
}

.preset-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

.preset-card {
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
}

.preset-card:hover {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    transform: translateY(-2px);
}

.preset-icon {
    font-size: 24px;
    margin-bottom: 4px;
}

.preset-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 2px;
}

.preset-desc {
    font-size: 11px;
    color: var(--el-text-color-secondary);
}
</style>
