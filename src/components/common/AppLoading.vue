<template>
  <div class="app-loading" :class="[`app-loading--${size}`]">
    <el-icon class="app-loading__spinner">
      <Loading />
    </el-icon>
    <span>{{ text }}</span>
  </div>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue'

defineProps({
  text: {
    type: String,
    default: '正在加载...'
  },
  size: {
    type: String,
    default: 'default',
    validator: value => ['compact', 'default', 'large'].includes(value)
  }
})
</script>

<style scoped>
.app-loading {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--lc-space-2);
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-body);
}

.app-loading--compact {
  min-height: 44px;
  font-size: var(--lc-font-size-caption);
}

.app-loading--large {
  min-height: 240px;
}

.app-loading__spinner {
  color: var(--lc-brand-500);
  animation: app-loading-rotate 1s linear infinite;
}

@keyframes app-loading-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
