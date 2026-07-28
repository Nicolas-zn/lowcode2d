<template>
    <div class="data-mapping-config">
        <div class="config-header">
            <el-switch v-model="localConfig.enabled" active-text="启用数据映射" />
            <el-tooltip content="将源数据字段映射到目标字段，支持嵌套路径和表达式" placement="top">
                <el-icon class="help-icon">
                    <QuestionFilled />
                </el-icon>
            </el-tooltip>
        </div>

        <template v-if="localConfig.enabled">
            <div class="mapping-rules">
                <div class="rules-header">
                    <span class="rules-title">映射规则</span>
                    <el-button type="primary" size="small" @click="addRule">
                        <el-icon>
                            <Plus />
                        </el-icon>
                        添加映射
                    </el-button>
                </div>

                <el-empty v-if="localConfig.rules.length === 0" description="暂无映射规则" :image-size="48" />

                <div v-for="(rule, index) in localConfig.rules" :key="index" class="rule-item">
                    <div class="rule-fields">
                        <div class="field-group">
                            <label class="field-label">源字段</label>
                            <el-input v-model="rule.sourceField" placeholder="data.list[0].name" size="small">
                                <template #prefix>
                                    <el-icon>
                                        <Document />
                                    </el-icon>
                                </template>
                            </el-input>
                        </div>

                        <el-icon class="arrow-icon">
                            <Right />
                        </el-icon>

                        <div class="field-group">
                            <label class="field-label">目标字段</label>
                            <el-input v-model="rule.targetField" placeholder="userName" size="small">
                                <template #prefix>
                                    <el-icon>
                                        <FolderOpened />
                                    </el-icon>
                                </template>
                            </el-input>
                        </div>
                    </div>

                    <div class="rule-options">
                        <div class="option-group">
                            <el-checkbox v-model="rule.useExpression" size="small">
                                使用表达式
                            </el-checkbox>
                        </div>

                        <div v-if="rule.useExpression" class="expression-input">
                            <label class="field-label">表达式</label>
                            <el-input v-model="rule.expression" placeholder="$.price * $.quantity" size="small">
                                <template #prefix>
                                    <el-icon>
                                        <EditPen />
                                    </el-icon>
                                </template>
                            </el-input>
                            <div class="expression-hint">
                                使用 $ 表示当前数据对象，如 $.name、$.data.value
                            </div>
                        </div>

                        <div class="option-group">
                            <label class="field-label">默认值</label>
                            <el-input v-model="rule.defaultValue" placeholder="可选" size="small" style="width: 120px;" />
                        </div>
                    </div>

                    <div class="rule-actions">
                        <el-button type="danger" size="small" :icon="Delete" circle @click="removeRule(index)" />
                    </div>
                </div>
            </div>

            <el-divider />

            <div class="preset-mappings">
                <div class="preset-title">快捷模板</div>
                <div class="preset-buttons">
                    <el-button size="small" @click="applyPreset('flatten')">
                        展平嵌套
                    </el-button>
                    <el-button size="small" @click="applyPreset('rename')">
                        字段重命名
                    </el-button>
                    <el-button size="small" @click="applyPreset('extract')">
                        提取数组项
                    </el-button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
    Plus, Delete, Right, Document, FolderOpened, EditPen, QuestionFilled
} from '@element-plus/icons-vue'

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({
            enabled: false,
            rules: []
        })
    }
})

const emit = defineEmits(['update:modelValue'])

const localConfig = ref({
    enabled: props.modelValue?.enabled || false,
    rules: props.modelValue?.rules || []
})

// 同步本地配置到父组件
watch(localConfig, (newVal) => {
    emit('update:modelValue', newVal)
}, { deep: true })

// 监听外部变化
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        localConfig.value = {
            enabled: newVal.enabled || false,
            rules: newVal.rules || []
        }
    }
}, { deep: true })

// 添加映射规则
const addRule = () => {
    localConfig.value.rules.push({
        sourceField: '',
        targetField: '',
        useExpression: false,
        expression: '',
        defaultValue: ''
    })
}

// 删除映射规则
const removeRule = (index) => {
    localConfig.value.rules.splice(index, 1)
}

// 应用预设模板
const applyPreset = (type) => {
    switch (type) {
        case 'flatten':
            localConfig.value.rules.push(
                { sourceField: 'data.id', targetField: 'id', useExpression: false, expression: '', defaultValue: '' },
                { sourceField: 'data.name', targetField: 'name', useExpression: false, expression: '', defaultValue: '' },
                { sourceField: 'data.value', targetField: 'value', useExpression: false, expression: '', defaultValue: '' }
            )
            break
        case 'rename':
            localConfig.value.rules.push(
                { sourceField: 'oldFieldName', targetField: 'newFieldName', useExpression: false, expression: '', defaultValue: '' }
            )
            break
        case 'extract':
            localConfig.value.rules.push(
                { sourceField: 'list[0]', targetField: 'firstItem', useExpression: false, expression: '', defaultValue: '' }
            )
            break
    }
}
</script>

<style scoped>
.data-mapping-config {
    padding: 16px;
}

.config-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.help-icon {
    color: var(--el-text-color-secondary);
    cursor: help;
}

.mapping-rules {
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    padding: 16px;
}

.rules-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.rules-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
}

.rule-item {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    transition: all 0.2s;
}

.rule-item:hover {
    border-color: var(--el-border-color);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.rule-fields {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    margin-bottom: 12px;
}

.field-group {
    flex: 1;
}

.field-label {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
}

.arrow-icon {
    font-size: 20px;
    color: var(--el-color-primary);
    margin-bottom: 8px;
}

.rule-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
}

.option-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.expression-input {
    flex: 1;
    min-width: 200px;
}

.expression-hint {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    margin-top: 4px;
}

.rule-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--el-border-color-lighter);
}

.preset-mappings {
    margin-top: 16px;
}

.preset-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
}

.preset-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
</style>
