<template>
  <div class="event-config-panel">
    <el-divider content-position="left">
      <el-icon>
        <Connection />
      </el-icon>
      <span style="margin-left: 8px;">事件配置</span>
    </el-divider>

    <div v-if="interactions.length === 0" class="empty-hint">
      <el-text type="info" size="small">暂无事件，点击下方按钮添加</el-text>
    </div>

    <div v-for="(item, index) in interactions" :key="index" class="event-card">
      <div class="event-header">
        <el-tag size="small">事件 {{ index + 1 }}</el-tag>
        <el-button type="danger" size="small" :icon="Delete" circle @click="removeEvent(index)" />
      </div>

      <div class="event-body">
        <!-- 触发对象 -->
        <el-form-item label="属性" label-width="70px">
          <el-input v-model="item.property" size="small" placeholder="name" value="name" style="width: 100%;" />
        </el-form-item>

        <el-form-item label="匹配模式" label-width="70px">
          <el-select v-model="item.matchType" size="small" placeholder="equal" style="width: 100%;">
            <el-option label="等于 (equal)" value="equal" />
            <el-option label="包含 (include)" value="include" />
          </el-select>
        </el-form-item>

        <el-form-item label="值" label-width="70px">
          <div style="display: flex; gap: 8px;">
            <el-input v-model="item.value" size="small" placeholder="cube" style="flex: 1;" />
            <el-button size="small" type="primary" @click="detectObject(item)">检测</el-button>
          </div>
        </el-form-item>

        <!-- 触发事件 -->
        <el-form-item label="触发事件" label-width="70px">
          <el-select v-model="item.event" size="small" style="width: 100%;">
            <el-option label="点击" value="click" />
            <el-option label="悬停" value="hover" />
            <el-option label="离开" value="hoverEnd" />
          </el-select>
        </el-form-item>

        <!-- 执行动作 -->
        <el-form-item label="执行动作" label-width="70px">
          <el-select v-model="item.actions" multiple size="small" style="width: 100%;">
            <el-option label="显示弹窗" value="popup" />
            <el-option label="显示提示" value="tooltip" />
            <el-option label="高亮对象" value="highlight" />
            <el-option label="飞行到对象" value="flyTo" />
            <el-option label="改变颜色" value="changeColor" />
            <el-option label="显示信息" value="showInfo" />
            <el-option label="请求接口" value="request" />
          </el-select>
        </el-form-item>

        <!-- 动作参数配置 -->
        <el-form-item v-if="item.actions.length > 0" label="动作参数" label-width="70px">
          <el-button size="small" @click="configActionParams(item)">配置参数</el-button>
        </el-form-item>

        <!-- 测试按钮 -->
        <el-form-item label="测试" label-width="70px">
          <el-button size="small" type="success" @click="testEvent(item)">测试事件</el-button>
        </el-form-item>
      </div>
    </div>

    <el-button type="primary" :icon="Plus" @click="addEvent" style="width: 100%; margin-top: 8px;">
      添加事件
    </el-button>

    <!-- 参数配置对话框 -->
    <el-dialog v-model="paramDialogVisible" title="动作参数配置" width="500px">
      <el-form v-if="currentItem" label-width="100px">
        <div v-for="action in currentItem.actions" :key="action" style="margin-bottom: 16px;">
          <el-divider content-position="left">{{ getActionLabel(action) }}</el-divider>

          <template v-if="action === 'flyTo'">
            <el-form-item label="飞行时长(秒)">
              <el-input-number v-model="currentItem.actionParams[action].duration" :min="0.5" :max="5" :step="0.5" size="small" />
            </el-form-item>
            <el-form-item label="距离(米)">
              <el-input-number v-model="currentItem.actionParams[action].offset" :min="100" :max="5000" :step="100" size="small" />
            </el-form-item>
          </template>

          <template v-if="action === 'changeColor'">
            <el-form-item label="颜色">
              <el-color-picker v-model="currentItem.actionParams[action].color" size="small" />
            </el-form-item>
            <el-form-item label="透明度">
              <el-slider v-model="currentItem.actionParams[action].alpha" :min="0" :max="1" :step="0.1" />
            </el-form-item>
          </template>

          <template v-if="action === 'showInfo'">
            <el-form-item label="标题">
              <el-input v-model="currentItem.actionParams[action].title" size="small" placeholder="对象信息" />
            </el-form-item>
            <el-form-item label="显示时长(毫秒)">
              <el-input-number v-model="currentItem.actionParams[action].duration" :min="1000" :max="10000" :step="1000" size="small" />
            </el-form-item>
          </template>

          <template v-if="action === 'request'">
            <el-form-item label="接口地址">
              <el-input v-model="currentItem.actionParams[action].url" size="small" placeholder="https://api.example.com" />
            </el-form-item>
            <el-form-item label="请求方法">
              <el-select v-model="currentItem.actionParams[action].method" size="small">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
              </el-select>
            </el-form-item>
          </template>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="paramDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveActionParams">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Connection, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as Cesium from 'cesium'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const interactions = ref([])
const paramDialogVisible = ref(false)
const currentItem = ref(null)

// 初始化
watch(() => props.modelValue, (val) => {
  if (val) {
    interactions.value = JSON.parse(JSON.stringify(val))
  }
}, { immediate: true })

// 同步更新
watch(interactions, (val) => {
  emit('update:modelValue', val)
}, { deep: true })

// 添加事件
const addEvent = () => {
  interactions.value.push({
    property: 'name',
    matchType: 'equal',
    value: '',
    event: 'click',
    actions: [],
    actionParams: {}
  })
}

// 删除事件
const removeEvent = (index) => {
  interactions.value.splice(index, 1)
}

// 配置动作参数
const configActionParams = (item) => {
  if (!item.actionParams) {
    item.actionParams = {}
  }

  item.actions.forEach(action => {
    if (!item.actionParams[action]) {
      item.actionParams[action] = getDefaultParams(action)
    }
  })

  currentItem.value = item
  paramDialogVisible.value = true
}

// 获取默认参数
const getDefaultParams = (action) => {
  const defaults = {
    flyTo: { duration: 1.5, offset: 500 },
    changeColor: { color: '#FFFF00', alpha: 0.8 },
    showInfo: { title: '对象信息', duration: 3000 },
    request: { url: '', method: 'GET' }
  }
  return defaults[action] || {}
}

// 保存参数
const saveActionParams = () => {
  paramDialogVisible.value = false
}

// 获取动作标签
const getActionLabel = (action) => {
  const labels = {
    popup: '显示弹窗',
    tooltip: '显示提示',
    highlight: '高亮对象',
    flyTo: '飞行到对象',
    changeColor: '改变颜色',
    showInfo: '显示信息',
    request: '请求接口'
  }
  return labels[action] || action
}

// 测试事件
const testEvent = (item) => {
  if (!item.value) {
    ElMessage.warning('请先配置匹配值')
    return
  }

  const viewer = window.cesiumViewer
  if (!viewer) {
    ElMessage.warning('地图未初始化')
    return
  }

  const entities = viewer.entities.values
  const matchType = item.matchType || 'equal'
  const property = item.property || 'name'

  let found = []
  if (matchType === 'equal') {
    found = entities.filter(e => e[property] === item.value)
  } else {
    found = entities.filter(e => e[property]?.includes(item.value))
  }

  if (found.length === 0) {
    ElMessage.error('未找到匹配的对象')
    return
  }

  ElMessage.success(`测试: 找到 ${found.length} 个对象，模拟触发事件`)

  // 模拟触发事件
  window.dispatchEvent(new CustomEvent('cesium:test-event', {
    detail: {
      event: item.event,
      actions: item.actions,
      actionParams: item.actionParams,
      object: found[0]
    }
  }))
}

// 检测对象
const detectObject = (item) => {
  if (!item.value) {
    ElMessage.warning('请输入值')
    return
  }

  const viewer = window.cesiumViewer
  if (!viewer) {
    ElMessage.warning('地图未初始化')
    return
  }

  const entities = viewer.entities.values
  const matchType = item.matchType || 'equal'
  const property = item.property || 'name'

  let found = []
  if (matchType === 'equal') {
    found = entities.filter(e => e[property] === item.value)
  } else {
    found = entities.filter(e => e[property]?.includes(item.value))
  }

  if (found.length > 0) {
    if (found.length === 1) {
      viewer.flyTo(found[0], { duration: 1 })
    }
    ElMessage.success(`找到 ${found.length} 个对象`)
  } else {
    ElMessage.error('未找到匹配的对象')
  }
}
</script>

<style scoped>
.event-config-panel {
  width: 100%;
}

.empty-hint {
  text-align: center;
  padding: 16px 0;
}

.event-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  background: var(--el-fill-color-blank);
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.event-body :deep(.el-form-item) {
  margin-bottom: 8px;
}
</style>
