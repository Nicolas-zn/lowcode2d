<template>
    <div class="data-script-editor">
        <div class="config-header">
            <el-switch v-model="localConfig.enabled" active-text="启用自定义脚本" />
            <el-tooltip content="使用 JavaScript 代码自定义数据转换逻辑" placement="top">
                <el-icon class="help-icon">
                    <QuestionFilled />
                </el-icon>
            </el-tooltip>
        </div>

        <template v-if="localConfig.enabled">
            <el-alert title="安全提示" type="warning" :closable="false" show-icon class="security-alert">
                <template #default>
                    脚本将在沙箱环境中执行，请确保代码安全可靠
                </template>
            </el-alert>

            <div class="editor-container">
                <div class="editor-header">
                    <span class="editor-title">转换脚本</span>
                    <div class="editor-actions">
                        <el-dropdown @command="insertTemplate">
                            <el-button size="small">
                                <el-icon>
                                    <Document />
                                </el-icon>
                                插入模板
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="basic">基础模板</el-dropdown-item>
                                    <el-dropdown-item command="filter">过滤数据</el-dropdown-item>
                                    <el-dropdown-item command="map">映射转换</el-dropdown-item>
                                    <el-dropdown-item command="aggregate">聚合统计</el-dropdown-item>
                                    <el-dropdown-item command="sort">排序数据</el-dropdown-item>
                                    <el-dropdown-item command="complex">复杂处理</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                        <el-button size="small" @click="formatCode">
                            <el-icon>
                                <Edit />
                            </el-icon>
                            格式化
                        </el-button>
                    </div>
                </div>

                <div class="code-editor">
                    <el-input v-model="localConfig.code" type="textarea" :rows="16" placeholder="// 编写数据转换函数
function transform(data) {
  // data 是输入数据
  // 返回处理后的数据
  return data;
}" class="code-input" />
                </div>
            </div>

            <!-- 可用工具函数 -->
            <div class="utils-section">
                <el-collapse>
                    <el-collapse-item title="可用工具函数" name="utils">
                        <div class="utils-grid">
                            <div class="util-item">
                                <div class="util-name">sum(arr, field)</div>
                                <div class="util-desc">求和</div>
                            </div>
                            <div class="util-item">
                                <div class="util-name">avg(arr, field)</div>
                                <div class="util-desc">平均值</div>
                            </div>
                            <div class="util-item">
                                <div class="util-name">max(arr, field)</div>
                                <div class="util-desc">最大值</div>
                            </div>
                            <div class="util-item">
                                <div class="util-name">min(arr, field)</div>
                                <div class="util-desc">最小值</div>
                            </div>
                            <div class="util-item">
                                <div class="util-name">count(arr)</div>
                                <div class="util-desc">计数</div>
                            </div>
                            <div class="util-item">
                                <div class="util-name">groupBy(arr, field)</div>
                                <div class="util-desc">分组</div>
                            </div>
                            <div class="util-item">
                                <div class="util-name">getNestedValue(obj, path)</div>
                                <div class="util-desc">获取嵌套值</div>
                            </div>
                            <div class="util-item">
                                <div class="util-name">formatNumber(value, options)</div>
                                <div class="util-desc">格式化数字</div>
                            </div>
                            <div class="util-item">
                                <div class="util-name">formatDate(value, options)</div>
                                <div class="util-desc">格式化日期</div>
                            </div>
                            <div class="util-item">
                                <div class="util-name">formatCurrency(value, options)</div>
                                <div class="util-desc">格式化货币</div>
                            </div>
                            <div class="util-item">
                                <div class="util-name">filterData(arr, conditions, logic)</div>
                                <div class="util-desc">过滤数据</div>
                            </div>
                            <div class="util-item">
                                <div class="util-name">sortData(arr, rules)</div>
                                <div class="util-desc">排序数据</div>
                            </div>
                        </div>
                    </el-collapse-item>
                </el-collapse>
            </div>

            <!-- 测试区域 -->
            <div class="test-section">
                <div class="test-header">
                    <span class="test-title">脚本测试</span>
                    <el-button type="primary" size="small" @click="runTest" :loading="testing">
                        <el-icon>
                            <VideoPlay />
                        </el-icon>
                        运行测试
                    </el-button>
                </div>

                <div class="test-content">
                    <div class="test-input">
                        <div class="test-label">测试输入</div>
                        <el-input v-model="testInput" type="textarea" :rows="5"
                            placeholder='[{"name": "张三", "age": 25}]' />
                    </div>
                    <div class="test-output" v-if="testResult !== null">
                        <div class="test-label">输出结果</div>
                        <pre class="test-result-content">{{ testResult }}</pre>
                    </div>
                    <el-alert v-if="testError" :title="testError" type="error" show-icon />
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { QuestionFilled, Document, Edit, VideoPlay } from '@element-plus/icons-vue'
import { executeScript } from '../utils/dataTransform'

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({
            enabled: false,
            code: ''
        })
    }
})

const emit = defineEmits(['update:modelValue'])

const localConfig = ref({
    enabled: props.modelValue?.enabled || false,
    code: props.modelValue?.code || ''
})

const testInput = ref('[\n  {"name": "张三", "age": 25, "salary": 10000},\n  {"name": "李四", "age": 30, "salary": 15000}\n]')
const testResult = ref(null)
const testError = ref('')
const testing = ref(false)

// 同步到父组件
watch(localConfig, (newVal) => {
    emit('update:modelValue', newVal)
}, { deep: true })

// 监听外部变化
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        localConfig.value = {
            enabled: newVal.enabled || false,
            code: newVal.code || ''
        }
    }
}, { deep: true })

// 脚本模板
const templates = {
    basic: `// 基础转换模板
function transform(data) {
  // data 是输入数据（通常是数组）
  // 直接返回原数据
  return data;
}`,
    filter: `// 数据过滤模板
function transform(data) {
  // 过滤 age > 20 的数据
  return data.filter(item => item.age > 20);
}`,
    map: `// 数据映射转换模板
function transform(data) {
  return data.map(item => ({
    // 重命名字段
    userName: item.name,
    userAge: item.age,
    // 添加计算字段
    isAdult: item.age >= 18,
    // 格式化字段
    ageDisplay: item.age + '岁'
  }));
}`,
    aggregate: `// 数据聚合模板
function transform(data) {
  // 使用内置工具函数
  const totalSalary = sum(data, 'salary');
  const avgSalary = avg(data, 'salary');
  const maxSalary = max(data, 'salary');
  const count = data.length;
  
  return [{
    totalSalary,
    avgSalary,
    maxSalary,
    count
  }];
}`,
    sort: `// 数据排序模板
function transform(data) {
  // 按 salary 降序排序
  return [...data].sort((a, b) => b.salary - a.salary);
}`,
    complex: `// 复杂处理模板
function transform(data) {
  // 1. 过滤无效数据
  const validData = data.filter(item => item.salary > 0);
  
  // 2. 按部门分组
  const grouped = groupBy(validData, 'department');
  
  // 3. 计算每个部门的统计数据
  const result = Object.entries(grouped).map(([dept, items]) => ({
    department: dept,
    count: items.length,
    totalSalary: sum(items, 'salary'),
    avgSalary: avg(items, 'salary')
  }));
  
  // 4. 按平均薪资降序排序
  return result.sort((a, b) => b.avgSalary - a.avgSalary);
}`
}

// 插入模板
const insertTemplate = (command) => {
    localConfig.value.code = templates[command] || templates.basic
}

// 格式化代码（简单实现）
const formatCode = () => {
    try {
        // 基本的代码格式化
        let code = localConfig.value.code
        // 这里可以接入更专业的代码格式化库
        localConfig.value.code = code.trim()
    } catch (e) {
        // 忽略格式化错误
    }
}

// 运行测试
const runTest = () => {
    if (!testInput.value) {
        testError.value = '请输入测试数据'
        return
    }

    testing.value = true
    testError.value = ''
    testResult.value = null

    try {
        const inputData = JSON.parse(testInput.value)
        const result = executeScript(inputData, localConfig.value.code)
        testResult.value = JSON.stringify(result, null, 2)
    } catch (error) {
        testError.value = `执行错误: ${error.message}`
    } finally {
        testing.value = false
    }
}
</script>

<style scoped>
.data-script-editor {
    padding: 16px;
}

.config-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.help-icon {
    color: var(--el-text-color-secondary);
    cursor: help;
}

.security-alert {
    margin-bottom: 16px;
}

.editor-container {
    background: var(--el-fill-color-darker);
    border-radius: 8px;
    overflow: hidden;
}

.editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--el-fill-color-dark);
    border-bottom: 1px solid var(--el-border-color-darker);
}

.editor-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
}

.editor-actions {
    display: flex;
    gap: 8px;
}

.code-editor {
    padding: 0;
}

.code-input :deep(textarea) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    background: var(--el-fill-color-darker);
    border: none;
    border-radius: 0;
    padding: 16px;
    color: var(--el-text-color-primary);
}

.code-input :deep(.el-textarea__inner) {
    box-shadow: none !important;
}

.utils-section {
    margin-top: 16px;
}

.utils-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.util-item {
    background: var(--el-fill-color-lighter);
    padding: 8px 12px;
    border-radius: 4px;
}

.util-name {
    font-family: monospace;
    font-size: 12px;
    color: var(--el-color-primary);
    margin-bottom: 2px;
}

.util-desc {
    font-size: 11px;
    color: var(--el-text-color-secondary);
}

.test-section {
    margin-top: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    padding: 16px;
}

.test-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.test-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
}

.test-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.test-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
}

.test-result-content {
    background: var(--el-bg-color);
    padding: 12px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.6;
    max-height: 200px;
    overflow: auto;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
}
</style>
