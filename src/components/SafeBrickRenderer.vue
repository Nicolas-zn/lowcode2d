<template>
  <div class="brick-wrapper safe-brick-renderer">
    <div v-if="hasError || !brick" class="brick-error-state">
      <div class="brick-error-title">{{ brick ? '组件渲染失败' : '组件未注册' }}</div>
      <div class="brick-error-desc">{{ errorMessage }}</div>
      <el-button v-if="brick" size="small" @click.stop="retryRender">重试</el-button>
    </div>
    <component
      v-else
      :is="brick"
      v-bind="componentConfig.props || {}"
      :api-config="componentConfig.api"
      :data-source-id="componentConfig.dataSourceId"
      :data-transform="componentConfig.dataTransform"
      :echart-theme="componentConfig.echartTheme"
      :color-palette="componentConfig.colorPalette"
      :events="componentConfig.events"
      class="brick-renderer"
    />
  </div>
</template>

<script setup>
import { onErrorCaptured, ref, watch } from 'vue'

const props = defineProps({
  brick: {
    type: [Object, Function, String],
    default: null
  },
  componentConfig: {
    type: Object,
    required: true
  }
})

const hasError = ref(false)
const errorMessage = ref('')

const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
}

const retryRender = () => {
  resetError()
}

onErrorCaptured((error) => {
  hasError.value = true
  errorMessage.value = error?.message || `${props.componentConfig?.type || '组件'} 渲染异常`
  return false
})

watch(
  () => props.componentConfig,
  () => resetError(),
  { deep: true }
)
</script>

<style scoped>
.safe-brick-renderer,
.brick-renderer {
  width: 100%;
  height: 100%;
}

.brick-error-state {
  width: 100%;
  height: 100%;
  min-height: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1px dashed var(--lc-danger-300);
  border-radius: var(--lc-radius-md);
  background: color-mix(in srgb, var(--lc-danger-50) 72%, var(--lc-bg-panel));
  color: var(--lc-danger-700);
  text-align: center;
}

.brick-error-title {
  font-size: var(--lc-font-size-body);
  font-weight: var(--lc-font-weight-semibold);
}

.brick-error-desc {
  max-width: 100%;
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-caption);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
