<template>
  <el-dialog v-model="visible" title="数据源调试工具" width="800px" :close-on-click-modal="false">
    <div class="debug-panel">
      <!-- 数据源选择 -->
      <el-form label-width="100px">
        <el-form-item label="选择数据源">
          <el-select v-model="selectedDataSourceId" placeholder="请选择数据源" style="width: 100%;">
            <el-option v-for="ds in dataSources" :key="ds.id" :label="ds.name" :value="ds.id">
              <span>{{ ds.name }}</span>
              <el-tag size="small" style="margin-left: 8px;">{{ getTypeName(ds.type) }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 数据源信息 -->
      <template v-if="selectedDataSource">
        <el-divider content-position="left">数据源信息</el-divider>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="名称">{{ selectedDataSource.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getTypeName(selectedDataSource.type) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ formatTime(selectedDataSource.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 操作按钮 -->
        <div style="margin-top: 16px;">
          <el-button type="primary" @click="testDataSource" :loading="testing">
            <el-icon>
              <VideoPlay />
            </el-icon>
            测试数据源
          </el-button>
          <el-button @click="clearCache">
            <el-icon>
              <Delete />
            </el-icon>
            清除缓存
          </el-button>
        </div>

        <!-- 测试结果 -->
        <el-divider content-position="left">测试结果</el-divider>

        <el-alert v-if="testError" type="error" :title="testError" :closable="false" style="margin-bottom: 16px;" />

        <el-alert v-if="testSuccess" type="success" title="测试成功" :closable="false" style="margin-bottom: 16px;" />

        <!-- 数据预览 -->
        <div class="data-preview">
          <div class="preview-header">
            <span>数据预览</span>
            <el-button size="small" @click="copyData" v-if="testData">
              <el-icon>
                <CopyDocument />
              </el-icon>
              复制数据
            </el-button>
          </div>
          <el-input v-model="testDataStr" type="textarea" :rows="12" readonly placeholder="点击测试数据源查看返回的数据" />
        </div>
      </template>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDataSourceStore } from '../stores/dataSourceStore'
import { ElMessage } from 'element-plus'
import { VideoPlay, Delete, CopyDocument } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const dataSourceStore = useDataSourceStore()
const dataSources = computed(() => dataSourceStore.dataSources)

const selectedDataSourceId = ref(null)
const testing = ref(false)
const testData = ref(null)
const testDataStr = ref('')
const testError = ref('')
const testSuccess = ref(false)

// 获取选中的数据源
const selectedDataSource = computed(() => {
  if (!selectedDataSourceId.value) return null
  return dataSources.value.find(ds => ds.id === selectedDataSourceId.value)
})

// 获取类型名称
const getTypeName = (type) => {
  const typeMap = {
    'api': 'API',
    'mock': 'Mock',
    'websocket': 'WebSocket'
  }
  return typeMap[type] || type
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 测试数据源
const testDataSource = async () => {
  if (!selectedDataSourceId.value) {
    ElMessage.warning('请先选择数据源')
    return
  }

  testing.value = true
  testError.value = ''
  testSuccess.value = false
  testData.value = null
  testDataStr.value = ''

  try {
    const data = await dataSourceStore.fetchData(selectedDataSourceId.value)
    testData.value = data
    testDataStr.value = JSON.stringify(data, null, 2)
    testSuccess.value = true
    ElMessage.success('测试成功')
  } catch (error) {
    testError.value = error.message || '测试失败'
    ElMessage.error('测试失败: ' + testError.value)
  } finally {
    testing.value = false
  }
}

// 清除缓存
const clearCache = () => {
  if (!selectedDataSourceId.value) {
    ElMessage.warning('请先选择数据源')
    return
  }

  delete dataSourceStore.dataCache[selectedDataSourceId.value]
  ElMessage.success('缓存已清除')
}

// 复制数据
const copyData = () => {
  if (!testDataStr.value) return

  navigator.clipboard.writeText(testDataStr.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 监听数据源变化，清空测试结果
watch(selectedDataSourceId, () => {
  testData.value = null
  testDataStr.value = ''
  testError.value = ''
  testSuccess.value = false
})
</script>

<style scoped>
.debug-panel {
  padding: 8px 0;
}

.data-preview {
  margin-top: 16px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
}

:deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
}
</style>