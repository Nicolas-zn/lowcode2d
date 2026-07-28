<template>
  <div class="video-editor">
    <el-form-item label="视频地址">
      <el-input v-model="localProps.src" placeholder="请输入视频地址" clearable @change="emitChange" />
    </el-form-item>

    <el-form-item label="适配模式">
      <el-select v-model="localProps.objectFit" placeholder="请选择适配模式" style="width: 100%" @change="emitChange">
        <el-option label="等比包含" value="contain" />
        <el-option label="等比裁剪" value="cover" />
        <el-option label="拉伸填充" value="fill" />
        <el-option label="原始尺寸" value="none" />
        <el-option label="等比缩小" value="scale-down" />
      </el-select>
    </el-form-item>

    <el-form-item label="显示控件">
      <el-switch v-model="localProps.controls" @change="emitChange" />
    </el-form-item>

    <el-form-item label="自动播放">
      <el-switch v-model="localProps.autoplay" @change="emitChange" />
    </el-form-item>

    <el-form-item label="静音">
      <el-switch v-model="localProps.muted" @change="emitChange" />
    </el-form-item>

    <el-form-item label="循环">
      <el-switch v-model="localProps.loop" @change="emitChange" />
    </el-form-item>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const localProps = reactive({
  src: '',
  controls: true,
  autoplay: true,
  muted: true,
  loop: false,
  objectFit: 'contain'
})

const syncFromModel = (value = {}) => {
  Object.assign(localProps, {
    src: value.src || '',
    controls: value.controls !== undefined ? value.controls : true,
    autoplay: value.autoplay !== undefined ? value.autoplay : true,
    muted: value.muted !== undefined ? value.muted : true,
    loop: value.loop !== undefined ? value.loop : false,
    objectFit: value.objectFit || 'contain'
  })
}

const emitChange = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    ...localProps
  })
}

let isUpdating = false
watch(() => props.modelValue, (newVal) => {
  if (!isUpdating) {
    isUpdating = true
    syncFromModel(newVal)
    isUpdating = false
  }
}, { immediate: true, deep: true })
</script>
