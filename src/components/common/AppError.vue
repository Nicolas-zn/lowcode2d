<template>
  <div class="app-error">
    <div class="app-error__icon">
      <el-icon>
        <WarningFilled />
      </el-icon>
    </div>
    <div class="app-error__body">
      <h3>{{ title }}</h3>
      <p v-if="description">{{ description }}</p>
      <details v-if="detail" class="app-error__detail">
        <summary>错误详情</summary>
        <pre>{{ detail }}</pre>
      </details>
      <div v-if="$slots.actions" class="app-error__actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { WarningFilled } from '@element-plus/icons-vue'

defineProps({
  title: {
    type: String,
    default: '操作失败'
  },
  description: {
    type: String,
    default: ''
  },
  detail: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.app-error {
  display: flex;
  gap: var(--lc-space-3);
  padding: var(--lc-space-4);
  border: 1px solid var(--lc-danger-200);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-danger-50);
  color: var(--lc-text-secondary);
}

.app-error__icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--lc-radius-md);
  color: var(--lc-danger-600);
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-error__body {
  flex: 1;
  min-width: 0;
}

.app-error h3 {
  margin: 0;
  color: var(--lc-text-primary);
  font-size: var(--lc-font-size-body);
  font-weight: 600;
  line-height: var(--lc-line-height-body);
}

.app-error p {
  margin: var(--lc-space-1) 0 0;
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
}

.app-error__detail {
  margin-top: var(--lc-space-3);
  font-size: var(--lc-font-size-caption);
}

.app-error__detail summary {
  cursor: pointer;
  color: var(--lc-danger-600);
}

.app-error__detail pre {
  max-height: 160px;
  overflow: auto;
  margin: var(--lc-space-2) 0 0;
  padding: var(--lc-space-3);
  border-radius: var(--lc-radius-md);
  background: var(--lc-bg-panel);
  color: var(--lc-text-primary);
  font-size: 12px;
  line-height: 18px;
}

.app-error__actions {
  display: flex;
  gap: var(--lc-space-2);
  margin-top: var(--lc-space-3);
  flex-wrap: wrap;
}
</style>
