<template>
  <div class="data-transform-config">
    <el-form-item label="启用转换">
      <el-switch v-model="localConfig.enabled" />
    </el-form-item>

    <template v-if="localConfig.enabled">
      <!-- 路径映射配置 -->
      <el-form-item label="路径映射">
        <el-button size="small" @click="addMapping" style="margin-bottom: 8px;">
          <el-icon><Plus /></el-icon>
          添加映射
        </el-button>
        
        <div v-for="(value, key, index) in localConfig.pathMapping" :key="index" class="mapping-item">
          <el-input 
            v-model="mappingKeys[index]" 
            placeholder="目标字段" 
            size="small"
            style="width: 40%;"
            @change="updateMappingKey(index, $event)"
          />
          <el-icon style="margin: 0 8px;"><Right /></el-icon>
          <el-input 
            v-model="localConfig.pathMapping[key]" 
            placeholder="源路径 (如: data.list)" 
            size="small"
            style="width: 40%;"
          />
          <el-button 
            type="danger" 
            size="small" 
            :icon="Delete" 
            circle
            @click="removeMapping(key)"
            style="margin-left: 8px;"
          />
        </div>
      </el-form-item>

      <!-- 自定义转换函数 -->
      <el-form-item label="转换函数">
        <el-input
          v-model="localConfig.transformFunction"
          type="textarea"
          :rows="6"
          placeholder="function transform(data) {&#10;  // 自定义转换逻辑&#10;  return data;&#10;}"
        />
        <div class="hint-text">
          提示：输入一个 JavaScript 函数，接收原始数据作为参数，返回转换后的数据
        </div>
      </el-form-item>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Plus, Right, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      enabled: false,
      pathMapping: {},
      transformFunction: ''
    })
  }
})

const emit = defineEmits(['update:modelValue'])

const localConfig = ref({
  enabled: props.modelValue?.enabled || false,
  pathMapping: props.modelValue?.pathMapping || {},
  transformFunction: props.modelValue?.transformFunction || ''
})

// 用于显示的映射键数组
const mappingKeys = ref(Object.keys(localConfig.value.pathMapping))

// 监听本地配置变化，向上传递
watch(localConfig, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

// 监听外部变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    localConfig.value = {
      enabled: newVal.enabled || false,
      pathMapping: newVal.pathMapping || {},
      transformFunction: newVal.transformFunction || ''
    }
    mappingKeys.value = Object.keys(localConfig.value.pathMapping)
  }
}, { deep: true })

// 添加映射
const addMapping = () => {
  const newKey = `field${Object.keys(localConfig.value.pathMapping).length + 1}`
  localConfig.value.pathMapping[newKey] = ''
  mappingKeys.value.push(newKey)
}

// 删除映射
const removeMapping = (key) => {
  delete localConfig.value.pathMapping[key]
  const index = mappingKeys.value.indexOf(key)
  if (index > -1) {
    mappingKeys.value.splice(index, 1)
  }
}

// 更新映射键
const updateMappingKey = (index, newKey) => {
  const oldKey = Object.keys(localConfig.value.pathMapping)[index]
  if (oldKey !== newKey && newKey) {
    const value = localConfig.value.pathMapping[oldKey]
    delete localConfig.value.pathMapping[oldKey]
    localConfig.value.pathMapping[newKey] = value
    mappingKeys.value[index] = newKey
  }
}
</script>

<style scoped>
.data-transform-config {
  padding: 8px 0;
}

.mapping-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.hint-text {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
