<template>
  <div class="app-empty" :class="[`app-empty--${size}`]">
    <div class="app-empty__icon">
      <el-icon>
        <component :is="icon" />
      </el-icon>
    </div>
    <div class="app-empty__content">
      <h3>{{ title }}</h3>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="app-empty__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { Box } from '@element-plus/icons-vue'

defineProps({
  title: {
    type: String,
    default: '暂无内容'
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: [Object, Function],
    default: Box
  },
  size: {
    type: String,
    default: 'default',
    validator: value => ['compact', 'default', 'large'].includes(value)
  }
})
</script>

<style scoped>
.app-empty {
  width: 100%;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--lc-space-3);
  padding: var(--lc-space-6);
  color: var(--lc-text-secondary);
  text-align: center;
}

.app-empty--compact {
  gap: var(--lc-space-2);
  padding: var(--lc-space-4);
}

.app-empty--large {
  min-width: 360px;
  padding: var(--lc-space-8);
}

.app-empty__icon {
  width: 48px;
  height: 48px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-xl);
  background: var(--lc-bg-subtle);
  color: var(--lc-brand-500);
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-empty--compact .app-empty__icon {
  width: 36px;
  height: 36px;
  border-radius: var(--lc-radius-lg);
}

.app-empty--large .app-empty__icon {
  width: 56px;
  height: 56px;
}

.app-empty__icon :deep(.el-icon) {
  font-size: 24px;
}

.app-empty--compact .app-empty__icon :deep(.el-icon) {
  font-size: 18px;
}

.app-empty__content h3 {
  margin: 0;
  color: var(--lc-text-primary);
  font-size: var(--lc-font-size-body);
  font-weight: 600;
  line-height: var(--lc-line-height-body);
}

.app-empty__content p {
  max-width: 360px;
  margin: var(--lc-space-1) 0 0;
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
}

.app-empty__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--lc-space-2);
  flex-wrap: wrap;
}
</style>
