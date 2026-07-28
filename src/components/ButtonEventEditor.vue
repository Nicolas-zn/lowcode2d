<template>
  <div class="button-event-editor">
    <el-divider content-position="left">
      <el-icon><Connection /></el-icon>
      <span style="margin-left: 8px;">事件配置</span>
    </el-divider>

    <div v-if="localEvents.length === 0" class="empty-hint">
      <el-text type="info" size="small">暂无事件，点击下方按钮添加</el-text>
    </div>

    <div v-for="(item, index) in localEvents" :key="index" class="event-card">
      <div class="event-header">
        <el-tag size="small" type="success">地图交互行为 {{ index + 1 }}</el-tag>
        <el-button type="danger" size="small" :icon="Delete" circle @click="removeEvent(index)" />
      </div>

      <el-form-item label="类型">
        <el-input disabled value="点击按钮 (Click)" size="small" style="width: 100%" />
      </el-form-item>

      <el-form-item label="操作组件">
        <el-input disabled value="全局 GIS 地图 (Cesium)" size="small" style="width: 100%" />
      </el-form-item>

      <el-form-item label="操作动作">
        <el-select v-model="item.buttonAction.type" size="small" style="width: 100%" @change="onParamsChange">
          <el-option label="复位视角 (Home)" value="home" />
          <el-option label="定位视野 (Location)" value="flyTo" />
          <el-option label="相机漫游 (Roam)" value="roam" />
          <el-option label="高亮模型 (Highlight)" value="highlight" />
          <el-option label="显示/隐藏图层 (Toggle)" value="toggleLayer" />
        </el-select>
      </el-form-item>

      <template v-if="item.buttonAction.type === 'home'">
        <div class="hint-text emphasize">* 触发时会自动将地图拉回至该地图在右侧面板的“地图配置”中预设的初始视角状态</div>
      </template>

      <!-- 定位配置 -->
      <template v-if="item.buttonAction.type === 'flyTo'">
        <el-form-item label="定位方式">
          <el-radio-group v-model="item.buttonAction.params.targetType" size="small" @change="onParamsChange">
            <el-radio label="coordinate">坐标经纬点</el-radio>
            <el-radio label="entity">指定模型/实体名称</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="输入坐标" v-if="item.buttonAction.params.targetType === 'coordinate'">
          <el-input v-model="item.buttonAction.params.coordinateStr" size="small" placeholder="例: 116.39, 39.9, 1000" @input="onParamsChange" />
          <div class="hint-text">格式: 经度, 纬度, [高度(可选)]</div>
        </el-form-item>
        <el-form-item label="目标名称" v-if="item.buttonAction.params.targetType === 'entity'">
          <el-input v-model="item.buttonAction.params.entityName" size="small" placeholder="被聚焦对象的确切名称" @input="onParamsChange" />
        </el-form-item>
      </template>

      <!-- 漫游配置 -->
      <template v-if="item.buttonAction.type === 'roam'">
        <el-form-item label="节点数据">
          <el-input v-model="item.buttonAction.params.pathStr" type="textarea" :rows="3" placeholder="示例: [116.39, 39.9], [116.4, 39.9]" size="small" @input="onRoamPathInput(item)" />
          <div class="hint-text" style="color:red;" v-if="item.buttonAction.pathError">{{ item.buttonAction.pathError }}</div>
          <div class="hint-text">允许 [[经度, 纬度]...] 或直接混合平铺格式</div>
        </el-form-item>
        <el-form-item label="全局高度">
          <el-input-number v-model="item.buttonAction.params.height" :min="10" :step="100" size="small" @change="onParamsChange" />
        </el-form-item>
        <el-form-item label="每次延时">
          <el-input-number v-model="item.buttonAction.params.delay" :min="0" :step="1000" size="small" placeholder="节点停顿期(毫秒)" @change="onParamsChange" />
        </el-form-item>
      </template>

      <!-- 高亮模型配置 -->
      <template v-if="item.buttonAction.type === 'highlight'">
        <el-form-item label="被亮对象">
          <el-input v-model="item.buttonAction.params.entityName" size="small" placeholder="输入模型名称 (Name)" @input="onParamsChange" />
        </el-form-item>
        <el-form-item label="提示色彩">
          <el-color-picker v-model="item.buttonAction.params.color" size="small" show-alpha @change="onParamsChange" />
        </el-form-item>
        <div class="hint-text emphasize">* 触发时会自动飞行拉近视角至此模型并点亮</div>
      </template>

      <!-- 显示隐藏配置 -->
      <template v-if="item.buttonAction.type === 'toggleLayer'">
        <el-form-item label="先选类型">
          <el-select v-model="item.buttonAction.params.layerType" size="small" @change="onParamsChange">
            <el-option label="影像底图/瓦片 (Imagery)" value="imagery" />
            <el-option label="矢量数据流结构 (DataSource)" value="datasource" />
          </el-select>
        </el-form-item>
        <el-form-item label="具体名称">
          <el-input v-model="item.buttonAction.params.layerName" size="small" placeholder="对应面板中注册图层的 Name" @input="onParamsChange" />
        </el-form-item>
        <el-form-item label="期望状态">
          <el-switch v-model="item.buttonAction.params.visible" active-text="显示" inactive-text="隐藏" inline-prompt @change="onParamsChange" />
        </el-form-item>
      </template>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 15px;">
         <el-button type="warning" size="small" :icon="VideoPlay" @click="testPreview(item)">验证并模拟运行</el-button>
      </div>

    </div>

    <el-button v-if="localEvents.length === 0" type="primary" :icon="Plus" @click="addEvent" style="width: 100%; margin-top: 8px;">
      新增按钮核心行为
    </el-button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Connection, Plus, Delete, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])
const localEvents = ref([])

// 初始化映射
watch(() => props.modelValue, (val) => {
  if (val && Array.isArray(val)) {
    // We filter and keep only standard ButtonBrick structured events
    localEvents.value = JSON.parse(JSON.stringify(val)).filter(e => e.buttonAction)
  }
}, { immediate: true })

const initParamsByType = (type) => {
  switch (type) {
    case 'home': return {}
    case 'flyTo': return { targetType: 'coordinate', coordinateStr: '116.39, 39.9, 1000', entityName: '' }
    case 'roam': return { pathStr: '', height: 1000, delay: 0 }
    case 'highlight': return { entityName: '', color: 'rgba(255, 0, 0, 0.6)' }
    case 'toggleLayer': return { layerType: 'imagery', layerName: '', visible: false }
    default: return {}
  }
}

const addEvent = () => {
  const defaultAction = 'flyTo'
  localEvents.value.push({
    eventType: 'click',
    enabled: true,
    buttonAction: {
      type: defaultAction,
      params: initParamsByType(defaultAction)
    },
    // Compatible with standard engine (compiles later to customCode)
    actions: []
  })
  onParamsChange()
}

const removeEvent = (index) => {
  localEvents.value.splice(index, 1)
  onParamsChange()
}

// 抽取坐标字串校验
const extractNumbersStr = (str) => {
  if (!str) return []
  const matches = str.match(/-?\d+(\.\d+)?/g)
  return matches ? matches.map(m => parseFloat(m)) : []
}

const parseRoamPoints = (str, gHeight, delay) => {
  const flatArr = extractNumbersStr(str);
  const points = []
  for (let i = 0; i < flatArr.length; i += 2) {
    if (flatArr[i] !== undefined && flatArr[i+1] !== undefined && !isNaN(flatArr[i])) {
      points.push({ longitude: flatArr[i], latitude: flatArr[i+1], height: gHeight || 1000, delay: delay || 0 })
    }
  }
  return points
}

const onRoamPathInput = (item) => {
  const flatArr = extractNumbersStr(item.buttonAction.params.pathStr)
  if (flatArr.length > 0 && flatArr.length % 2 !== 0) {
    item.buttonAction.pathError = '节点不成对，可能是经纬度缺失！'
  } else if (flatArr.length === 0) {
    item.buttonAction.pathError = '格式不含有可识别的数字节点！'
  } else {
    item.buttonAction.pathError = null
  }
  onParamsChange()
}

// 将界面的定制结构单向汇编到系统的 "actions" 脚本中
const compileCustomCode = (item) => {
  const act = item.buttonAction
  let code = `if (!window.$cesiumBrick) return console.warn("地图引擎主引用尚未挂载！");\n`
  
  if (act.type === 'home') {
    code += `window.$cesiumBrick.flyHome();`
  } else if (act.type === 'flyTo') {
    if (act.params.targetType === 'entity') {
      code += `window.$cesiumBrick.flyToEntity("${act.params.entityName || ''}");`
    } else {
      const coords = extractNumbersStr(act.params.coordinateStr)
      if (coords.length >= 2) {
        code += `window.$cesiumBrick.flyTo({ longitude: ${coords[0]}, latitude: ${coords[1]}, height: ${coords[2] || 1500} });`
      }
    }
  } else if (act.type === 'roam') {
    const ptsArrStr = JSON.stringify(parseRoamPoints(act.params.pathStr, act.params.height, act.params.delay))
    code += `window.$cesiumBrick.startCameraRoam(${ptsArrStr});`
  } else if (act.type === 'highlight') {
    code += `window.$cesiumBrick.highlightEntity("${act.params.entityName || ''}", "${act.params.color || '#FF0000'}", 0.6);\n`
    code += `window.$cesiumBrick.flyToEntity("${act.params.entityName || ''}");`
  } else if (act.type === 'toggleLayer') {
    code += `window.$cesiumBrick.toggleLayer("${act.params.layerName || ''}", ${act.params.visible});`
  }
  
  return {
    type: 'custom',
    customCode: code
  }
}

const onParamsChange = () => {
  localEvents.value.forEach(item => {
    // 自动判断并补充分支数据的缺失
    if (!item.buttonAction.params || typeof item.buttonAction.params !== 'object') {
       item.buttonAction.params = initParamsByType(item.buttonAction.type)
    }
    // 强制每次编译生成标准脚本给外侧系统调用
    item.actions = [compileCustomCode(item)]
  })
  
  // Vue 的深层监听可以直接抛出去了！
  emit('update:modelValue', localEvents.value)
}

const testPreview = (item) => {
  const act = item.actions.find(a => a.type === 'custom')
  if (!act || !act.customCode) {
    return ElMessage.warning('动作未成功构建！')
  }
  if (!window.$cesiumBrick) {
    return ElMessage.warning('警告：当前工程大屏中还未放置或激活过 Cesium (GIS地图) 组件，操作无响应！')
  }
  
  try {
    const fn = new Function('eventData', 'component', act.customCode)
    fn({}, null)
    ElMessage.success('成功下发模拟动作！')
  } catch (e) {
    ElMessage.error('模拟事件阻断: ' + e.message)
  }
}
</script>

<style scoped>
.button-event-editor {
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
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  border-bottom: 1px dashed var(--color-border);
  padding-bottom: 10px;
}

:deep(.el-form-item) {
  margin-bottom: 12px !important;
}

.hint-text {
  font-size: 11px;
  color: #999;
  line-height: 1.4;
  margin-top: 4px;
}
.hint-text.emphasize {
  padding-left: 80px; 
  margin-top: -8px; 
  margin-bottom: 10px; 
  color: #e6a23c;
}
</style>
