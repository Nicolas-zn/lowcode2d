<template>
    <div class="data-aggregate-config">
        <div class="config-header">
            <el-switch v-model="localConfig.enabled" active-text="启用数据聚合" />
            <el-tooltip content="对数据进行分组和统计计算，如求和、平均值、最大最小值等" placement="top">
                <el-icon class="help-icon">
                    <QuestionFilled />
                </el-icon>
            </el-tooltip>
        </div>

        <template v-if="localConfig.enabled">
            <!-- 分组字段 -->
            <div class="config-section">
                <div class="section-title">
                    <span>分组字段</span>
                    <el-tag size="small" type="info">可选</el-tag>
                </div>
                <div class="section-hint">
                    不设置分组字段时，将对全部数据进行聚合统计
                </div>

                <div class="group-fields">
                    <el-tag v-for="(field, index) in localConfig.groupBy" :key="index" closable
                        @close="removeGroupField(index)" class="group-tag">
                        {{ field }}
                    </el-tag>
                    <el-popover :visible="showGroupInput" placement="bottom-start" :width="200">
                        <template #reference>
                            <el-button size="small" @click="showGroupInput = true">
                                <el-icon>
                                    <Plus />
                                </el-icon>
                                添加分组字段
                            </el-button>
                        </template>
                        <div class="group-input-popover">
                            <el-input v-model="newGroupField" placeholder="输入字段名" size="small"
                                @keyup.enter="addGroupField" />
                            <div class="popover-actions">
                                <el-button size="small" @click="showGroupInput = false">取消</el-button>
                                <el-button type="primary" size="small" @click="addGroupField">添加</el-button>
                            </div>
                        </div>
                    </el-popover>
                </div>
            </div>

            <el-divider />

            <!-- 聚合指标 -->
            <div class="config-section">
                <div class="section-title">
                    <span>聚合指标</span>
                    <el-button type="primary" size="small" @click="addMetric">
                        <el-icon>
                            <Plus />
                        </el-icon>
                        添加指标
                    </el-button>
                </div>

                <el-empty v-if="localConfig.metrics.length === 0" description="请添加聚合指标" :image-size="48" />

                <div v-for="(metric, index) in localConfig.metrics" :key="index" class="metric-item">
                    <div class="metric-row">
                        <div class="metric-field">
                            <label class="field-label">字段</label>
                            <el-input v-model="metric.field" placeholder="要聚合的字段" size="small" />
                        </div>
                        <div class="metric-function">
                            <label class="field-label">聚合函数</label>
                            <el-select v-model="metric.function" placeholder="选择函数" size="small">
                                <el-option-group label="数值统计">
                                    <el-option label="求和 (SUM)" value="sum">
                                        <span class="fn-option">
                                            <span class="fn-label">求和</span>
                                            <span class="fn-code">SUM</span>
                                        </span>
                                    </el-option>
                                    <el-option label="平均值 (AVG)" value="avg">
                                        <span class="fn-option">
                                            <span class="fn-label">平均值</span>
                                            <span class="fn-code">AVG</span>
                                        </span>
                                    </el-option>
                                    <el-option label="最大值 (MAX)" value="max">
                                        <span class="fn-option">
                                            <span class="fn-label">最大值</span>
                                            <span class="fn-code">MAX</span>
                                        </span>
                                    </el-option>
                                    <el-option label="最小值 (MIN)" value="min">
                                        <span class="fn-option">
                                            <span class="fn-label">最小值</span>
                                            <span class="fn-code">MIN</span>
                                        </span>
                                    </el-option>
                                </el-option-group>
                                <el-option-group label="计数统计">
                                    <el-option label="计数 (COUNT)" value="count">
                                        <span class="fn-option">
                                            <span class="fn-label">计数</span>
                                            <span class="fn-code">COUNT</span>
                                        </span>
                                    </el-option>
                                    <el-option label="去重计数 (COUNT DISTINCT)" value="countDistinct">
                                        <span class="fn-option">
                                            <span class="fn-label">去重计数</span>
                                            <span class="fn-code">COUNT DISTINCT</span>
                                        </span>
                                    </el-option>
                                </el-option-group>
                                <el-option-group label="取值">
                                    <el-option label="第一条 (FIRST)" value="first">
                                        <span class="fn-option">
                                            <span class="fn-label">第一条</span>
                                            <span class="fn-code">FIRST</span>
                                        </span>
                                    </el-option>
                                    <el-option label="最后一条 (LAST)" value="last">
                                        <span class="fn-option">
                                            <span class="fn-label">最后一条</span>
                                            <span class="fn-code">LAST</span>
                                        </span>
                                    </el-option>
                                    <el-option label="去重列表 (DISTINCT)" value="distinct">
                                        <span class="fn-option">
                                            <span class="fn-label">去重列表</span>
                                            <span class="fn-code">DISTINCT</span>
                                        </span>
                                    </el-option>
                                    <el-option label="连接 (CONCAT)" value="concat">
                                        <span class="fn-option">
                                            <span class="fn-label">连接</span>
                                            <span class="fn-code">CONCAT</span>
                                        </span>
                                    </el-option>
                                </el-option-group>
                            </el-select>
                        </div>
                        <div class="metric-alias">
                            <label class="field-label">别名</label>
                            <el-input v-model="metric.alias" placeholder="可选" size="small" />
                        </div>
                        <el-button type="danger" size="small" :icon="Delete" circle @click="removeMetric(index)" />
                    </div>
                    <div class="metric-preview">
                        <span class="preview-label">输出字段：</span>
                        <code>{{ metric.alias || `${metric.function}_${metric.field || 'field'}` }}</code>
                    </div>
                </div>
            </div>

            <el-divider />

            <!-- 预设模板 -->
            <div class="preset-section">
                <div class="preset-title">常用聚合模板</div>
                <div class="preset-grid">
                    <div class="preset-card" @click="applyPreset('sales')">
                        <div class="preset-icon">📈</div>
                        <div class="preset-info">
                            <div class="preset-name">销售统计</div>
                            <div class="preset-desc">总销售额、订单数、客单价</div>
                        </div>
                    </div>
                    <div class="preset-card" @click="applyPreset('user')">
                        <div class="preset-icon">👥</div>
                        <div class="preset-info">
                            <div class="preset-name">用户统计</div>
                            <div class="preset-desc">用户数、平均年龄</div>
                        </div>
                    </div>
                    <div class="preset-card" @click="applyPreset('category')">
                        <div class="preset-icon">📊</div>
                        <div class="preset-info">
                            <div class="preset-name">分类汇总</div>
                            <div class="preset-desc">按类别统计数量</div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Plus, Delete, QuestionFilled } from '@element-plus/icons-vue'

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({
            enabled: false,
            groupBy: [],
            metrics: []
        })
    }
})

const emit = defineEmits(['update:modelValue'])

const localConfig = ref({
    enabled: props.modelValue?.enabled || false,
    groupBy: props.modelValue?.groupBy || [],
    metrics: props.modelValue?.metrics || []
})

const showGroupInput = ref(false)
const newGroupField = ref('')

// 同步到父组件
watch(localConfig, (newVal) => {
    emit('update:modelValue', newVal)
}, { deep: true })

// 监听外部变化
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        localConfig.value = {
            enabled: newVal.enabled || false,
            groupBy: newVal.groupBy || [],
            metrics: newVal.metrics || []
        }
    }
}, { deep: true })

// 添加分组字段
const addGroupField = () => {
    if (newGroupField.value && !localConfig.value.groupBy.includes(newGroupField.value)) {
        localConfig.value.groupBy.push(newGroupField.value)
        newGroupField.value = ''
        showGroupInput.value = false
    }
}

// 删除分组字段
const removeGroupField = (index) => {
    localConfig.value.groupBy.splice(index, 1)
}

// 添加聚合指标
const addMetric = () => {
    localConfig.value.metrics.push({
        field: '',
        function: 'sum',
        alias: ''
    })
}

// 删除聚合指标
const removeMetric = (index) => {
    localConfig.value.metrics.splice(index, 1)
}

// 应用预设模板
const applyPreset = (type) => {
    switch (type) {
        case 'sales':
            localConfig.value.metrics = [
                { field: 'amount', function: 'sum', alias: 'totalSales' },
                { field: 'orderId', function: 'count', alias: 'orderCount' },
                { field: 'amount', function: 'avg', alias: 'avgOrderValue' }
            ]
            break
        case 'user':
            localConfig.value.metrics = [
                { field: 'userId', function: 'countDistinct', alias: 'userCount' },
                { field: 'age', function: 'avg', alias: 'avgAge' }
            ]
            break
        case 'category':
            localConfig.value.groupBy = ['category']
            localConfig.value.metrics = [
                { field: 'id', function: 'count', alias: 'itemCount' },
                { field: 'price', function: 'sum', alias: 'totalValue' }
            ]
            break
    }
}
</script>

<style scoped>
.data-aggregate-config {
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

.config-section {
    margin-bottom: 16px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
}

.section-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 12px;
}

.group-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

.group-tag {
    font-size: 13px;
}

.group-input-popover {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.popover-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.metric-item {
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
}

.metric-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
}

.metric-field,
.metric-function {
    flex: 1;
}

.metric-alias {
    flex: 0 0 120px;
}

.field-label {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
}

.fn-option {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.fn-label {
    color: var(--el-text-color-primary);
}

.fn-code {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    font-family: monospace;
}

.metric-preview {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed var(--el-border-color-lighter);
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.metric-preview code {
    background: var(--el-fill-color);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    color: var(--el-color-primary);
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

.preset-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.preset-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 12px;
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
}

.preset-info {
    flex: 1;
}

.preset-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
}

.preset-desc {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
}
</style>
