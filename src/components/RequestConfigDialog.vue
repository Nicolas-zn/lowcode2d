<template>
  <el-dialog v-model="dialogVisible" title="接口请求配置" width="860px" :close-on-click-modal="false">
    <el-form label-width="100px">
      <el-form-item label="配置方式">
        <el-radio-group v-model="sourceMode">
          <el-radio-button label="existing">选择数据源</el-radio-button>
          <el-radio-button label="custom">自定义请求</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="sourceMode === 'existing'">
        <el-form-item label="数据源" required>
          <el-select v-model="selectedDataSourceId" placeholder="请选择数据源" style="width: 100%">
            <el-option
              v-for="source in apiDataSources"
              :key="source.id"
              :label="source.name"
              :value="source.id"
            >
              <span>{{ source.name }}</span>
              <span class="option-url">{{ getDataSourceOptionText(source) }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <div v-if="selectedDataSource" class="selected-source-card">
          <div>
            <strong>{{ selectedDataSource.name }}</strong>
            <span>{{ getDataSourceOptionText(selectedDataSource) }}</span>
          </div>
          <el-button :icon="VideoPlay" :loading="testing" @click="testRequest">测试数据源</el-button>
        </div>
        <el-empty v-else description="暂无可选数据源，请先在数据源面板中新建" :image-size="72" />
      </template>

      <template v-else>
      <el-form-item label="请求器" required>
        <el-select v-model="form.requesterId" placeholder="请选择请求器" style="width: 100%">
          <el-option v-for="requester in requesters" :key="requester.id" :label="requester.name" :value="requester.id">
            <span>{{ requester.name }}</span>
            <span class="option-url">{{ requester.baseUrl }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <div class="method-row">
        <el-form-item label="请求方法" required>
          <el-select v-model="form.method">
            <el-option v-for="method in methods" :key="method" :label="method" :value="method" />
          </el-select>
        </el-form-item>
        <el-form-item label="请求路径" required>
          <el-input v-model="form.path" placeholder="/api/data" />
        </el-form-item>
      </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane v-if="sourceMode === 'custom'" label="Query 参数" name="query">
          <KeyValueEditor v-model="form.queryRows" add-label="添加 Query" />
        </el-tab-pane>
        <el-tab-pane v-if="sourceMode === 'custom'" label="Header 覆盖" name="headers">
          <KeyValueEditor v-model="form.headerRows" add-label="添加 Header" />
        </el-tab-pane>
        <el-tab-pane v-if="sourceMode === 'custom'" label="Body" name="body">
          <el-input
            v-model="form.bodyText"
            type="textarea"
            :rows="10"
            placeholder='{"name":"value"}'
          />
        </el-tab-pane>
        <el-tab-pane label="参数映射" name="mapping">
          <DataTransformConfig v-model="form.dataTransform" />
        </el-tab-pane>
        <el-tab-pane label="测试结果" name="test">
          <div class="test-toolbar">
            <el-button type="primary" :icon="VideoPlay" :loading="testing" @click="testRequest">
              {{ sourceMode === 'existing' ? '测试数据源' : '测试请求' }}
            </el-button>
            <span v-if="testStatus">{{ testStatus }}</span>
          </div>
          <pre class="test-result">{{ testResultText }}</pre>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleConfirm">保存配置</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, h, reactive, ref, watch } from 'vue'
import { ElButton, ElCheckbox, ElInput, ElMessage } from 'element-plus'
import { Delete, Plus, VideoPlay } from '@element-plus/icons-vue'
import { useDataSourceStore } from '../stores/dataSourceStore'
import DataTransformConfig from './DataTransformConfig.vue'
import {
  buildRequesterHeaders,
  buildRequesterUrl,
  createKeyValueRow,
  describeDataSourceRequest,
  normalizeKeyValueRows,
  parseJsonText
} from '../utils/requester'

const KeyValueEditor = {
  props: {
    modelValue: { type: Array, default: () => [] },
    addLabel: { type: String, default: '添加参数' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const updateRow = (index, key, value) => {
      const rows = props.modelValue.slice()
      rows[index] = { ...rows[index], [key]: value }
      emit('update:modelValue', rows)
    }
    const addRow = () => emit('update:modelValue', [...props.modelValue, createKeyValueRow()])
    const removeRow = (index) => {
      const rows = props.modelValue.filter((_, rowIndex) => rowIndex !== index)
      emit('update:modelValue', rows.length ? rows : [createKeyValueRow()])
    }

    return () => h('div', { class: 'kv-editor' }, [
      ...props.modelValue.map((row, index) => h('div', { class: 'kv-editor-row' }, [
        h(ElCheckbox, {
          modelValue: row.enabled !== false,
          'onUpdate:modelValue': value => updateRow(index, 'enabled', value)
        }),
        h(ElInput, {
          modelValue: row.key,
          placeholder: '参数名',
          'onUpdate:modelValue': value => updateRow(index, 'key', value)
        }),
        h(ElInput, {
          modelValue: row.value,
          placeholder: '参数值',
          'onUpdate:modelValue': value => updateRow(index, 'value', value)
        }),
        h(ElButton, { icon: Delete, onClick: () => removeRow(index) })
      ])),
      h(ElButton, { icon: Plus, onClick: addRow }, () => props.addLabel)
    ])
  }
}

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  componentName: { type: String, default: '' },
  apiConfig: { type: Object, default: null },
  dataSourceId: { type: [String, Number], default: null },
  dataTransform: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const dataSourceStore = useDataSourceStore()
const requesters = computed(() => dataSourceStore.requesters)
const apiDataSources = computed(() => dataSourceStore.dataSources.filter(ds => ds.type === 'api'))
const selectedDataSource = computed(() => {
  return apiDataSources.value.find(source => source.id === selectedDataSourceId.value) || null
})
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const activeTab = ref('query')
const testing = ref(false)
const testStatus = ref('')
const testResultText = ref('')
const sourceMode = ref('custom')
const selectedDataSourceId = ref(null)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const defaultTransform = () => ({
  enabled: false,
  pathMapping: {},
  transformFunction: ''
})

const defaultForm = () => ({
  requesterId: requesters.value[0]?.id || 'default',
  method: 'GET',
  path: '',
  queryRows: [createKeyValueRow()],
  headerRows: [createKeyValueRow()],
  bodyText: '',
  dataTransform: defaultTransform()
})

const form = reactive(defaultForm())

const rowsFromObject = (value = {}) => {
  const rows = Object.entries(value).map(([key, rowValue]) => createKeyValueRow(key, rowValue, true))
  return rows.length ? rows : [createKeyValueRow()]
}

const fillForm = () => {
  const dataSource = dataSourceStore.dataSources.find(ds => ds.id === props.dataSourceId)
  const requestConfig = dataSource?.requestConfig || {}
  sourceMode.value = dataSource ? 'existing' : 'custom'
  selectedDataSourceId.value = dataSource?.id || apiDataSources.value[0]?.id || null

  Object.assign(form, defaultForm(), {
    requesterId: dataSource?.requesterId || requestConfig.requesterId || requesters.value[0]?.id || 'default',
    method: requestConfig.method || props.apiConfig?.method || 'GET',
    path: requestConfig.path || props.apiConfig?.suffix || '',
    queryRows: requestConfig.queryRows?.length ? requestConfig.queryRows : [createKeyValueRow()],
    headerRows: requestConfig.headerRows?.length
      ? requestConfig.headerRows
      : rowsFromObject(props.apiConfig?.headers || {}),
    bodyText: requestConfig.body ? JSON.stringify(requestConfig.body, null, 2) : '',
    dataTransform: props.dataTransform
      ? JSON.parse(JSON.stringify(props.dataTransform))
      : defaultTransform()
  })
  activeTab.value = sourceMode.value === 'existing' ? 'mapping' : 'query'
  testStatus.value = ''
  testResultText.value = ''
}

watch(() => props.modelValue, (visible) => {
  if (visible) fillForm()
})

watch(sourceMode, (mode) => {
  activeTab.value = mode === 'existing' ? 'mapping' : 'query'
  testStatus.value = ''
  testResultText.value = ''
})

const buildPayload = () => {
  const requester = dataSourceStore.getRequester(form.requesterId)
  if (!requester) throw new Error('请选择请求器')
  if (!form.path.trim()) throw new Error('请输入请求路径')

  const body = ['GET', 'DELETE'].includes(form.method)
    ? null
    : parseJsonText(form.bodyText, null)

  return {
    requester,
    requestConfig: {
      requesterId: form.requesterId,
      method: form.method,
      path: form.path.trim(),
      queryRows: form.queryRows,
      headerRows: form.headerRows,
      query: normalizeKeyValueRows(form.queryRows),
      headers: normalizeKeyValueRows(form.headerRows),
      body
    },
    dataTransform: JSON.parse(JSON.stringify(form.dataTransform))
  }
}

const getDataSourceOptionText = (source) => {
  const requester = dataSourceStore.getRequester(source.requesterId)
  return describeDataSourceRequest({ dataSource: source, requester }).description
}

const testRequest = async () => {
  try {
    testing.value = true
    if (sourceMode.value === 'existing') {
      if (!selectedDataSourceId.value) throw new Error('请选择数据源')
      const data = await dataSourceStore.fetchData(selectedDataSourceId.value)
      testStatus.value = '数据源测试成功'
      testResultText.value = JSON.stringify(data, null, 2)
    } else {
      const { requester, requestConfig } = buildPayload()
      const url = buildRequesterUrl({
        baseUrl: requester.baseUrl,
        path: requestConfig.path,
        queryRows: requestConfig.queryRows
      })
      const headers = buildRequesterHeaders({
        requester,
        headerRows: requestConfig.headerRows
      })
      const response = await fetch(url, {
        method: requestConfig.method,
        headers,
        body: requestConfig.body ? JSON.stringify(requestConfig.body) : undefined
      })
      const text = await response.text()
      testStatus.value = `HTTP ${response.status}`
      try {
        testResultText.value = JSON.stringify(JSON.parse(text), null, 2)
      } catch {
        testResultText.value = text
      }
    }
    activeTab.value = 'test'
  } catch (error) {
    ElMessage.error(`测试失败：${error.message}`)
  } finally {
    testing.value = false
  }
}

const handleConfirm = () => {
  try {
    if (sourceMode.value === 'existing') {
      if (!selectedDataSourceId.value) throw new Error('请选择数据源')
      emit('confirm', {
        dataSourceId: selectedDataSourceId.value,
        dataTransform: JSON.parse(JSON.stringify(form.dataTransform)),
        api: null
      })
      dialogVisible.value = false
      ElMessage.success('数据源已绑定')
      return
    }

    const { requester, requestConfig, dataTransform } = buildPayload()
    const existingDataSource = dataSourceStore.dataSources.find(ds => ds.id === props.dataSourceId)
    const dataSourcePayload = {
      name: props.componentName ? `${props.componentName} 接口` : '组件接口',
      type: 'api',
      requesterId: requester.id,
      requestConfig,
      config: {
        url: buildRequesterUrl({
          baseUrl: requester.baseUrl,
          path: requestConfig.path,
          queryRows: requestConfig.queryRows
        }),
        method: requestConfig.method,
        headers: buildRequesterHeaders({
          requester,
          headerRows: requestConfig.headerRows
        }),
        body: requestConfig.body
      },
      cacheEnabled: true,
      cacheDuration: 60000,
      retryEnabled: true,
      retryCount: 3
    }

    const dataSource = existingDataSource
      ? (dataSourceStore.updateDataSource(existingDataSource.id, dataSourcePayload), { ...existingDataSource, ...dataSourcePayload })
      : dataSourceStore.addDataSource(dataSourcePayload)

    emit('confirm', {
      dataSourceId: dataSource.id,
      dataTransform,
      api: null
    })
    dialogVisible.value = false
    ElMessage.success('接口请求配置已保存')
  } catch (error) {
    ElMessage.warning(error.message)
  }
}
</script>

<style scoped>
.method-row {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 12px;
}

.option-url {
  float: right;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.selected-source-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 16px 100px;
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.selected-source-card div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-source-card strong,
.selected-source-card span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-source-card strong {
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.selected-source-card span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

:deep(.kv-editor) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.kv-editor-row) {
  display: grid;
  grid-template-columns: auto 1fr 1fr auto;
  gap: 8px;
  align-items: center;
}

.test-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.test-result {
  min-height: 220px;
  max-height: 360px;
  overflow: auto;
  margin: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  line-height: 1.5;
}
</style>
