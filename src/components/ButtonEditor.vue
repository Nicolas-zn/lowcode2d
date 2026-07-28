<template>
  <div class="button-editor">
    <el-divider>按钮样式配置</el-divider>
    
    <el-form-item label="按钮文字">
      <el-input v-model="localProps.text" placeholder="按钮展示的文字" clearable />
    </el-form-item>

    <div class="split-row">
      <el-form-item label="类型主题" class="half-item">
        <el-select v-model="localProps.buttonType" placeholder="选择按钮类型">
          <el-option label="默认配置 (Primary)" value="primary" />
          <el-option label="成功类型 (Success)" value="success" />
          <el-option label="警告类型 (Warning)" value="warning" />
          <el-option label="危险类型 (Danger)" value="danger" />
          <el-option label="信息提示 (Info)" value="info" />
          <el-option label="简易文本 (Text)" value="text" />
        </el-select>
      </el-form-item>

      <el-form-item label="尺寸" class="half-item">
        <el-select v-model="localProps.size" placeholder="选择大小">
          <el-option label="偏大" value="large" />
          <el-option label="默认" value="default" />
          <el-option label="偏小" value="small" />
        </el-select>
      </el-form-item>
    </div>

    <div class="split-row align-items-center">
      <el-form-item label="朴素按钮" class="third-item">
        <el-switch v-model="localProps.plain" />
      </el-form-item>
      
      <el-form-item label="圆角" class="third-item">
        <el-switch v-model="localProps.round" />
      </el-form-item>
      
      <el-form-item label="全圆" class="third-item">
        <el-switch v-model="localProps.circle" />
      </el-form-item>
    </div>

    <el-form-item label="自定义色">
      <el-color-picker v-model="localProps.customColor" show-alpha />
      <span class="hint-text" style="margin-left: 10px;">如果设置，将覆盖主题色</span>
    </el-form-item>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const localProps = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<style scoped>
.button-editor {
  width: 100%;
}
.split-row {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}
.half-item {
  flex: 1;
}
.third-item {
  flex: 1;
}
:deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}
.hint-text {
  font-size: 11px;
  color: #999;
}
.align-items-center {
  align-items: center;
}
</style>
