<template>
    <div class="data-format-config">
        <div class="config-header">
            <el-switch v-model="localConfig.enabled" active-text="启用数据格式化" />
            <el-tooltip content="格式化数据的显示方式，如日期、数字、货币等" placement="top">
                <el-icon class="help-icon">
                    <QuestionFilled />
                </el-icon>
            </el-tooltip>
        </div>

        <template v-if="localConfig.enabled">
            <div class="rules-container">
                <div class="rules-header">
                    <el-button type="primary" size="small" @click="addRule">
                        <el-icon>
                            <Plus />
                        </el-icon>
                        添加格式化规则
                    </el-button>
                </div>

                <el-empty v-if="localConfig.rules.length === 0" description="暂无格式化规则" :image-size="48" />

                <div v-for="(rule, index) in localConfig.rules" :key="index" class="rule-item">
                    <div class="rule-row">
                        <div class="rule-field">
                            <label class="field-label">字段名</label>
                            <el-input v-model="rule.field" placeholder="要格式化的字段" size="small" />
                        </div>
                        <div class="rule-formatter">
                            <label class="field-label">格式化类型</label>
                            <el-select v-model="rule.formatter" placeholder="选择格式化器" size="small"
                                @change="onFormatterChange(rule)">
                                <el-option-group label="数字">
                                    <el-option label="数字" value="number" />
                                    <el-option label="货币" value="currency" />
                                    <el-option label="百分比" value="percent" />
                                    <el-option label="文件大小" value="fileSize" />
                                </el-option-group>
                                <el-option-group label="日期时间">
                                    <el-option label="日期时间" value="date" />
                                    <el-option label="相对时间" value="relativeTime" />
                                </el-option-group>
                                <el-option-group label="文本">
                                    <el-option label="首字母大写" value="capitalize" />
                                    <el-option label="全部大写" value="uppercase" />
                                    <el-option label="全部小写" value="lowercase" />
                                    <el-option label="截断文本" value="truncate" />
                                </el-option-group>
                                <el-option-group label="脱敏">
                                    <el-option label="手机号脱敏" value="phoneMask" />
                                    <el-option label="身份证脱敏" value="idCardMask" />
                                    <el-option label="邮箱脱敏" value="emailMask" />
                                    <el-option label="银行卡脱敏" value="bankCardMask" />
                                </el-option-group>
                                <el-option-group label="其他">
                                    <el-option label="布尔值" value="boolean" />
                                    <el-option label="状态映射" value="status" />
                                    <el-option label="JSON" value="json" />
                                </el-option-group>
                            </el-select>
                        </div>
                        <el-button type="danger" size="small" :icon="Delete" circle @click="removeRule(index)" />
                    </div>

                    <!-- 格式化选项 -->
                    <div class="rule-options" v-if="getFormatterOptions(rule.formatter).length > 0">
                        <div class="options-title">格式化选项</div>
                        <div class="options-grid">
                            <template v-for="opt in getFormatterOptions(rule.formatter)" :key="opt.key">
                                <div class="option-item">
                                    <label class="option-label">{{ opt.label }}</label>
                                    <el-input v-if="opt.type === 'string'" v-model="rule.options[opt.key]"
                                        :placeholder="opt.placeholder" size="small" />
                                    <el-input-number v-else-if="opt.type === 'number'" v-model="rule.options[opt.key]"
                                        :min="opt.min || 0" :max="opt.max" size="small" />
                                    <el-switch v-else-if="opt.type === 'boolean'" v-model="rule.options[opt.key]"
                                        size="small" />
                                    <el-select v-else-if="opt.type === 'select'" v-model="rule.options[opt.key]"
                                        size="small">
                                        <el-option v-for="item in opt.options" :key="item.value" :label="item.label"
                                            :value="item.value" />
                                    </el-select>
                                </div>
                            </template>
                        </div>
                    </div>

                    <!-- 预览 -->
                    <div class="rule-preview">
                        <span class="preview-label">预览：</span>
                        <code>{{ getPreview(rule) }}</code>
                    </div>
                </div>
            </div>

            <el-divider />

            <!-- 快捷模板 -->
            <div class="preset-section">
                <div class="preset-title">常用格式化模板</div>
                <div class="preset-buttons">
                    <el-button size="small" @click="applyPreset('money')">
                        💰 金额格式化
                    </el-button>
                    <el-button size="small" @click="applyPreset('datetime')">
                        📅 日期时间
                    </el-button>
                    <el-button size="small" @click="applyPreset('privacy')">
                        🔒 隐私脱敏
                    </el-button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Plus, Delete, QuestionFilled } from '@element-plus/icons-vue'
import { formatters } from '../utils/dataTransform'

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

// 同步到父组件
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

// 格式化器选项配置
const formatterOptionsConfig = {
    number: [
        { key: 'decimals', label: '小数位数', type: 'number', min: 0, max: 10 },
        { key: 'thousandSeparator', label: '千分位分隔', type: 'boolean' },
        { key: 'prefix', label: '前缀', type: 'string', placeholder: '如 ¥' },
        { key: 'suffix', label: '后缀', type: 'string', placeholder: '如 元' }
    ],
    currency: [
        {
            key: 'currency', label: '货币类型', type: 'select', options: [
                { label: '人民币 (CNY)', value: 'CNY' },
                { label: '美元 (USD)', value: 'USD' },
                { label: '欧元 (EUR)', value: 'EUR' },
                { label: '日元 (JPY)', value: 'JPY' }
            ]
        },
        {
            key: 'locale', label: '区域', type: 'select', options: [
                { label: '中国', value: 'zh-CN' },
                { label: '美国', value: 'en-US' },
                { label: '日本', value: 'ja-JP' }
            ]
        }
    ],
    percent: [
        { key: 'decimals', label: '小数位数', type: 'number', min: 0, max: 6 },
        { key: 'multiply', label: '乘以100', type: 'boolean' }
    ],
    date: [
        {
            key: 'format', label: '日期格式', type: 'select', options: [
                { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
                { label: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' },
                { label: 'YYYY年MM月DD日', value: 'YYYY年MM月DD日' },
                { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
                { label: 'HH:mm:ss', value: 'HH:mm:ss' },
                { label: 'HH:mm', value: 'HH:mm' }
            ]
        }
    ],
    truncate: [
        { key: 'length', label: '最大长度', type: 'number', min: 1, max: 500 },
        { key: 'suffix', label: '省略符', type: 'string', placeholder: '...' }
    ],
    boolean: [
        { key: 'trueText', label: '真值文本', type: 'string', placeholder: '是' },
        { key: 'falseText', label: '假值文本', type: 'string', placeholder: '否' }
    ],
    fileSize: [
        { key: 'decimals', label: '小数位数', type: 'number', min: 0, max: 4 }
    ],
    json: [
        { key: 'indent', label: '缩进空格', type: 'number', min: 0, max: 8 }
    ]
}

// 获取格式化器选项
const getFormatterOptions = (formatter) => {
    return formatterOptionsConfig[formatter] || []
}

// 格式化器变更时初始化选项
const onFormatterChange = (rule) => {
    rule.options = {}
    const options = getFormatterOptions(rule.formatter)
    options.forEach(opt => {
        if (opt.type === 'boolean') {
            rule.options[opt.key] = true
        } else if (opt.type === 'number') {
            rule.options[opt.key] = opt.min || 2
        }
    })
}

// 获取预览
const getPreview = (rule) => {
    const formatter = formatters[rule.formatter]
    if (!formatter) return '-'

    const testValues = {
        number: 12345.678,
        currency: 12345.67,
        percent: 0.8567,
        fileSize: 1234567890,
        date: new Date().toISOString(),
        relativeTime: new Date(Date.now() - 3600000).toISOString(),
        capitalize: 'hello world',
        uppercase: 'hello world',
        lowercase: 'HELLO WORLD',
        truncate: '这是一段很长的文本内容，需要进行截断处理以便显示',
        phoneMask: '13812345678',
        idCardMask: '110101199001011234',
        emailMask: 'example@email.com',
        bankCardMask: '6225880123456789',
        boolean: true,
        status: 'active',
        json: { name: 'test', value: 123 }
    }

    try {
        return formatter(testValues[rule.formatter], rule.options || {})
    } catch {
        return '-'
    }
}

// 添加格式化规则
const addRule = () => {
    localConfig.value.rules.push({
        field: '',
        formatter: 'number',
        options: { decimals: 2, thousandSeparator: true }
    })
}

// 删除格式化规则
const removeRule = (index) => {
    localConfig.value.rules.splice(index, 1)
}

// 应用预设模板
const applyPreset = (type) => {
    switch (type) {
        case 'money':
            localConfig.value.rules.push({
                field: 'amount',
                formatter: 'currency',
                options: { currency: 'CNY', locale: 'zh-CN' }
            })
            break
        case 'datetime':
            localConfig.value.rules.push({
                field: 'createdAt',
                formatter: 'date',
                options: { format: 'YYYY-MM-DD HH:mm:ss' }
            })
            break
        case 'privacy':
            localConfig.value.rules.push(
                { field: 'phone', formatter: 'phoneMask', options: {} },
                { field: 'idCard', formatter: 'idCardMask', options: {} }
            )
            break
    }
}
</script>

<style scoped>
.data-format-config {
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

.rules-container {
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    padding: 16px;
}

.rules-header {
    margin-bottom: 16px;
}

.rule-item {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
}

.rule-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
}

.rule-field {
    flex: 1;
}

.rule-formatter {
    flex: 1;
}

.field-label {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
}

.rule-options {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--el-border-color-lighter);
}

.options-title {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
}

.options-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.option-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.option-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.rule-preview {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--el-border-color-lighter);
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.rule-preview code {
    background: var(--el-fill-color);
    padding: 2px 8px;
    border-radius: 4px;
    font-family: monospace;
    color: var(--el-color-success);
}

.preview-label {
    margin-right: 4px;
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

.preset-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
</style>
