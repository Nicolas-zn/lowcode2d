<template>
  <div class="cesium-event-panel">
    <el-divider content-position="left">
      <el-icon>
        <Connection />
      </el-icon>
      <span style="margin-left: 8px;">地图内部交互配置</span>
    </el-divider>

    <div v-if="interactions.length === 0" class="empty-hint">
      <el-text type="info" size="small">暂无交互，点击下方添加</el-text>
    </div>

    <div v-for="(item, index) in interactions" :key="index" class="event-card">
      <div class="event-header">
        <el-tag size="small" type="primary">交互 {{ index + 1 }}</el-tag>
        <el-button type="danger" size="small" :icon="Delete" circle @click="removeEvent(index)" />
      </div>

      <div class="event-body">
        <el-form-item label="名称匹配" label-width="70px">
          <div style="display: flex; gap: 8px; width: 100%;">
            <el-select v-model="item.matchType" size="small" style="flex: 0 0 30%;">
              <el-option label="等于" value="equal" />
              <el-option label="包含" value="include" />
            </el-select>
            <el-input v-model="item.value" size="small" placeholder="输入模型或实体的Name" style="flex: 1;" />
            <el-button type="primary" size="small" @click="detectAndLocate(item)">定位</el-button>
          </div>
        </el-form-item>

        <el-form-item label="触发动作" label-width="70px">
          <el-select v-model="item.event" size="small" style="width: 100%;">
            <el-option label="鼠标左键点击 (Click)" value="click" />
            <el-option label="鼠标悬停 (Hover)" value="hover" />
          </el-select>
        </el-form-item>

        <el-form-item label="执行动作" label-width="70px">
          <!-- 默认用多选 -->
          <el-select v-model="item.actions" multiple size="small" style="width: 100%;">
            <el-option label="显示弹窗 (Pop)" value="popup" />
            <el-option label="显示提示 (Tooltip)" value="tooltip" />
          </el-select>
        </el-form-item>

        <!-- 如果配置了 actions，则显示对应的自定义内容框 -->
        <template v-if="item.actions && item.actions.length > 0">
          <!-- 这里使用一个嵌套循环渲染所选的所有动作的内容配置，或者简单点合并管理 -->
          <div v-for="action in item.actions" :key="action" class="action-config-box">
             <div class="action-title">{{ action === 'popup' ? '弹窗配置' : '提示配置' }}</div>
             <el-form-item label="展示内容" label-width="70px">
               <el-input 
                 v-model="item.actionParams[action].content" 
                 type="textarea" 
                 :rows="2" 
                 size="small" 
                 placeholder="您可以输入纯文本，支持变量 ${name}"
               />
             </el-form-item>
             <el-form-item label="持续时间" label-width="70px" v-if="action === 'tooltip'">
               <el-input-number v-model="item.actionParams[action].duration" :min="1000" :step="1000" size="small" />
               <span style="font-size: 12px; margin-left: 5px; color: #999">毫秒</span>
             </el-form-item>
          </div>
        </template>
        
      </div>
    </div>

    <el-button type="primary" :icon="Plus" @click="addEvent" style="width: 100%; margin-top: 8px;">
      新增交互判定
    </el-button>
    <!-- 定位结果列表弹窗 -->
    <el-dialog v-model="locateDialogVisible" title="匹配到多个实体" width="500px">
      <el-table :data="matchedEntities" size="small" max-height="350">
        <el-table-column property="name" label="实体名称 (Name)" />
        <el-table-column property="id" label="系统ID" show-overflow-tooltip />
        <el-table-column label="操作" width="80" align="center">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="flyToSpecificEntity(scope.row)">聚焦</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Connection, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])
const interactions = ref([])

// 初始化
watch(() => props.modelValue, (val) => {
  if (val) {
    // We filter only native map events (not custom ButtonBrick ones!)
    interactions.value = JSON.parse(JSON.stringify(val)).filter(v => v.property === 'name')
  }
}, { immediate: true })

// 同步更新
watch(interactions, (val) => {
  emit('update:modelValue', val)
}, { deep: true })

// 动作默认参数构建
const ensureActionParams = (item) => {
  if (!item.actionParams) item.actionParams = {}
  item.actions.forEach(action => {
    if (!item.actionParams[action]) {
       item.actionParams[action] = {
           content: '',
           duration: action === 'tooltip' ? 2000 : 3000
       }
    }
  })
}

// 监听内部的actions变动，保证 params 数据节点在勾选时即就绪
watch(interactions, (newVal) => {
   newVal.forEach(item => {
      if (item.actions && item.actions.length > 0) {
         ensureActionParams(item)
      }
   })
}, { deep: true })

const addEvent = () => {
  interactions.value.push({
    property: 'name',   // 锁定属性必然为 name
    matchType: 'equal',
    value: '',
    event: 'click',
    actions: ['popup'],
    actionParams: {
       popup: { content: '', duration: 3000 }
    }
  })
}

const removeEvent = (index) => {
  interactions.value.splice(index, 1)
}

// 探测与定位逻辑
const locateDialogVisible = ref(false)
const matchedEntities = ref([])

const detectAndLocate = (item) => {
  if (!item.value) {
    return ElMessage.warning('请输入要匹配的名称关键字')
  }
  const viewer = window.cesiumViewer
  if (!viewer) {
    return ElMessage.warning('未能关联到地图实例，请确保画布中已加载过 Cesium 地图')
  }

  const entities = viewer.entities.values
  const matchType = item.matchType || 'equal'
  const val = item.value

  let found = []
  if (matchType === 'equal') {
    found = entities.filter(e => e.name === val)
  } else {
    found = entities.filter(e => e.name && e.name.includes(val))
  }

  if (found.length === 0) {
    ElMessage.error('该条件下未找到任何匹配的实体对象')
  } else if (found.length === 1) {
    if (window.$cesiumBrick) {
      window.$cesiumBrick.flyToEntity(found[0].id)
    }
    ElMessage.success('已为您定位到唯一匹配的目标')
  } else {
    matchedEntities.value = found.map(e => ({ name: e.name || '未知', id: e.id }))
    locateDialogVisible.value = true
    ElMessage.success(`找到 ${found.length} 个对象，请从列表中选择要强制定位的实体`)
  }
}

const flyToSpecificEntity = (row) => {
  if (window.$cesiumBrick) {
    window.$cesiumBrick.flyToEntity(row.id)
  }
}
</script>

<style scoped>
.cesium-event-panel {
  width: 100%;
}

.empty-hint {
  text-align: center;
  padding: 16px 0;
}

.event-card {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  background: var(--color-bg-primary);
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  border-bottom: 1px dashed var(--color-border);
  padding-bottom: 8px;
}

.event-body :deep(.el-form-item) {
  margin-bottom: 12px !important;
}

.action-config-box {
  background: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 10px;
  margin-top: 5px;
}
.action-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  font-weight: bold;
}
</style>
