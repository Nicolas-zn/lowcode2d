<template>
    <div class="data-transform-panel">
        <div class="panel-header">
            <div class="header-row-1">
                <h3 class="header-title">数据转换</h3>
                <span class="header-count">{{ transforms.length }}</span>
            </div>
            <div class="header-row-2">
                <el-button class="action-btn primary-btn" type="primary" size="small" @click="openAddDialog">
                    新建转换规则
                </el-button>
            </div>
        </div>

        <div class="transform-list">
            <el-empty v-if="transforms.length === 0" description="暂无转换规则" :image-size="60">
                <template #description>
                    <p>创建数据转换规则来处理API返回的数据</p>
                </template>
            </el-empty>

            <div v-for="transform in transforms" :key="transform.id" class="transform-item">
                <div class="transform-info">
                    <el-icon class="transform-icon">
                        <DataAnalysis />
                    </el-icon>
                    <div class="transform-details">
                        <div class="transform-name">{{ transform.name }}</div>
                        <div class="transform-desc">{{ getTransformSummary(transform) }}</div>
                    </div>
                </div>

                <div class="transform-actions">
                    <el-tooltip content="测试" placement="top">
                        <el-icon @click="testTransform(transform)">
                            <VideoPlay />
                        </el-icon>
                    </el-tooltip>
                    <el-tooltip content="编辑" placement="top">
                        <el-icon @click="editTransform(transform)">
                            <Edit />
                        </el-icon>
                    </el-tooltip>
                    <el-tooltip content="复制" placement="top">
                        <el-icon @click="duplicateTransform(transform)">
                            <CopyDocument />
                        </el-icon>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                        <el-icon @click="deleteTransform(transform.id)">
                            <Delete />
                        </el-icon>
                    </el-tooltip>
                </div>
            </div>
        </div>

        <!-- 编辑对话框 -->
        <el-dialog v-model="showDialog" :title="dialogTitle" width="900px" :close-on-click-modal="false"
            destroy-on-close class="transform-dialog">
            <div class="dialog-content">
                <el-tabs v-model="activeTab" class="config-tabs" tab-position="top" type="card"
                    :style="{ border: 'none' }">
                    <!-- 基本信息 -->
                    <el-tab-pane label="基本信息" name="basic">
                        <el-form :model="formData" label-width="100px">
                            <el-form-item label="规则名称" required>
                                <el-input v-model="formData.name" placeholder="请输入规则名称" />
                            </el-form-item>
                            <el-form-item label="描述">
                                <el-input v-model="formData.description" type="textarea" :rows="2"
                                    placeholder="可选的规则描述" />
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>

                    <!-- 数据映射 -->
                    <el-tab-pane label="数据映射" name="mapping">
                        <DataMappingConfig v-model="formData.mapping" />
                    </el-tab-pane>

                    <!-- 计算字段 -->
                    <el-tab-pane label="计算字段" name="calculated">
                        <CalculatedFieldsConfig v-model="formData.calculatedFields" />
                    </el-tab-pane>

                    <!-- 过滤排序 -->
                    <el-tab-pane label="过滤排序" name="filter">
                        <DataFilterConfig v-model:filters="formData.filters" v-model:sorting="formData.sorting" />
                    </el-tab-pane>

                    <!-- 聚合统计 -->
                    <el-tab-pane label="聚合统计" name="aggregate">
                        <DataAggregateConfig v-model="formData.aggregation" />
                    </el-tab-pane>

                    <!-- 数据格式化 -->
                    <el-tab-pane label="格式化" name="format">
                        <DataFormatConfig v-model="formData.formatting" />
                    </el-tab-pane>

                    <!-- 脚本转换 -->
                    <el-tab-pane label="脚本" name="script">
                        <DataScriptEditor v-model="formData.script" />
                    </el-tab-pane>
                </el-tabs>
            </div>

            <template #footer>
                <el-button @click="showDialog = false">取消</el-button>
                <el-button type="primary" @click="saveTransform">保存</el-button>
            </template>
        </el-dialog>

        <!-- 测试对话框 -->
        <el-dialog v-model="showTestDialog" title="测试数据转换" width="800px">
            <div class="test-container">
                <div class="test-input">
                    <div class="test-label">输入数据（JSON）</div>
                    <el-input v-model="testInput" type="textarea" :rows="10"
                        placeholder='输入测试数据，例如：[{"name": "张三", "age": 25}]' />
                </div>
                <div class="test-actions">
                    <el-button type="primary" @click="runTest" :loading="testing">
                        运行测试
                    </el-button>
                </div>
                <div class="test-output" v-if="testOutput !== null">
                    <div class="test-label">输出结果</div>
                    <pre class="test-result">{{ testOutput }}</pre>
                </div>
                <div class="test-error" v-if="testError">
                    <el-alert :title="testError" type="error" show-icon />
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataTransformStore } from '../stores/dataTransformStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    DataAnalysis, VideoPlay, Edit, Delete, CopyDocument
} from '@element-plus/icons-vue'
import DataMappingConfig from './DataMappingConfig.vue'
import CalculatedFieldsConfig from './CalculatedFieldsConfig.vue'
import DataFilterConfig from './DataFilterConfig.vue'
import DataAggregateConfig from './DataAggregateConfig.vue'
import DataFormatConfig from './DataFormatConfig.vue'
import DataScriptEditor from './DataScriptEditor.vue'

const transformStore = useDataTransformStore()

const transforms = computed(() => transformStore.transforms)

// 对话框状态
const showDialog = ref(false)
const showTestDialog = ref(false)
const editingId = ref(null)
const activeTab = ref('basic')
const dialogTitle = computed(() => editingId.value ? '编辑转换规则' : '新建转换规则')

// 测试相关
const testInput = ref('')
const testOutput = ref(null)
const testError = ref('')
const testing = ref(false)
const testingTransform = ref(null)

// 默认表单数据
const getDefaultFormData = () => ({
    name: '',
    description: '',
    mapping: {
        enabled: false,
        rules: []
    },
    calculatedFields: [],
    filters: {
        enabled: false,
        conditions: [],
        logic: 'and'
    },
    sorting: {
        enabled: false,
        rules: []
    },
    aggregation: {
        enabled: false,
        groupBy: [],
        metrics: []
    },
    formatting: {
        enabled: false,
        rules: []
    },
    script: {
        enabled: false,
        code: ''
    }
})

const formData = ref(getDefaultFormData())

// 获取转换规则摘要
const getTransformSummary = (transform) => {
    const features = []
    if (transform.mapping?.enabled) features.push('映射')
    if (transform.calculatedFields?.length > 0) features.push('计算字段')
    if (transform.filters?.enabled) features.push('过滤')
    if (transform.sorting?.enabled) features.push('排序')
    if (transform.aggregation?.enabled) features.push('聚合')
    if (transform.formatting?.enabled) features.push('格式化')
    if (transform.script?.enabled) features.push('脚本')

    return features.length > 0 ? features.join(' + ') : '无配置'
}

// 打开新建对话框
const openAddDialog = () => {
    editingId.value = null
    formData.value = getDefaultFormData()
    activeTab.value = 'basic'
    showDialog.value = true
}

// 编辑转换规则
const editTransform = (transform) => {
    editingId.value = transform.id
    formData.value = JSON.parse(JSON.stringify(transform))
    activeTab.value = 'basic'
    showDialog.value = true
}

// 复制转换规则
const duplicateTransform = (transform) => {
    const newTransform = {
        ...JSON.parse(JSON.stringify(transform)),
        id: null,
        name: `${transform.name} (副本)`
    }
    transformStore.createTransform(newTransform)
    ElMessage.success('复制成功')
}

// 删除转换规则
const deleteTransform = (id) => {
    ElMessageBox.confirm('确定要删除这个转换规则吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        transformStore.removeTransform(id)
        ElMessage.success('删除成功')
    }).catch(() => { })
}

// 保存转换规则
const saveTransform = () => {
    if (!formData.value.name) {
        ElMessage.warning('请输入规则名称')
        return
    }

    if (editingId.value) {
        transformStore.updateTransform(editingId.value, formData.value)
        ElMessage.success('更新成功')
    } else {
        transformStore.createTransform(formData.value)
        ElMessage.success('创建成功')
    }

    showDialog.value = false
}

// 测试转换规则
const testTransform = (transform) => {
    testingTransform.value = transform
    testInput.value = '[\n  {"name": "张三", "age": 25, "salary": 10000},\n  {"name": "李四", "age": 30, "salary": 15000},\n  {"name": "王五", "age": 28, "salary": 12000}\n]'
    testOutput.value = null
    testError.value = ''
    showTestDialog.value = true
}

// 运行测试
const runTest = () => {
    if (!testInput.value) {
        ElMessage.warning('请输入测试数据')
        return
    }

    testing.value = true
    testError.value = ''
    testOutput.value = null

    try {
        const inputData = JSON.parse(testInput.value)
        const result = transformStore.executeTransform(inputData, testingTransform.value.id)
        testOutput.value = JSON.stringify(result, null, 2)
    } catch (error) {
        testError.value = `执行错误: ${error.message}`
    } finally {
        testing.value = false
    }
}
</script>

<style scoped>
.data-transform-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color);
}

.panel-header {
    padding: 20px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.header-row-1 {
    display: flex;
    align-items: baseline;
    gap: 12px;
}

.header-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.header-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 8px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 600;
    border-radius: 12px;
}

.header-row-2 {
    display: flex;
    gap: 12px;
}

.action-btn {
    flex: 1;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.primary-btn {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
}

.transform-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.transform-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-light);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    transition: all 0.2s;
}

.transform-item:hover {
    border-color: var(--el-border-color);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
}

.transform-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.transform-icon {
    font-size: 24px;
    color: var(--el-color-success);
}

.transform-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.transform-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
}

.transform-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.transform-actions {
    display: flex;
    gap: 8px;
}

.transform-actions .el-icon {
    font-size: 16px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: color 0.2s;
}

.transform-actions .el-icon:hover {
    color: var(--el-color-primary);
}

.transform-dialog :deep(.el-dialog__body) {
    padding: 20px;
    max-height: calc(80vh - 120px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
}

.dialog-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: 100%;
}

.config-tabs {
    width: 100%;
    min-width: 0;
    border: none;
}


.test-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.test-label {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
}

.test-actions {
    display: flex;
    justify-content: center;
}

.test-result {
    background: var(--el-fill-color-light);
    padding: 16px;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.6;
    overflow-x: auto;
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
}
</style>
