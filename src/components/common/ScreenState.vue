<template>
  <div class="screen-state" :class="[`screen-state--${type}`]">
    <div class="screen-state__panel">
      <div class="screen-state__icon">
        <el-icon :class="{ 'is-loading': type === 'loading' }">
          <component :is="resolvedIcon" />
        </el-icon>
      </div>
      <div class="screen-state__content">
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <pre v-if="detail" class="screen-state__detail">{{ detail }}</pre>
      <div v-if="$slots.actions" class="screen-state__actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Box, CircleClose, Loading, WarningFilled } from '@element-plus/icons-vue'

const props = defineProps({
  type: {
    type: String,
    default: 'empty',
    validator: value => ['empty', 'loading', 'error', 'warning'].includes(value)
  },
  title: {
    type: String,
    default: '暂无内容'
  },
  description: {
    type: String,
    default: ''
  },
  detail: {
    type: String,
    default: ''
  },
  icon: {
    type: [Object, Function],
    default: null
  }
})

const iconMap = {
  empty: Box,
  loading: Loading,
  error: CircleClose,
  warning: WarningFilled
}

const resolvedIcon = computed(() => props.icon || iconMap[props.type] || Box)
</script>

<style scoped>
.screen-state {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--lc-space-6);
  background:
    radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.16), transparent 36%),
    linear-gradient(135deg, #07111f 0%, #101827 55%, #0f172a 100%);
}

.screen-state__panel {
  width: min(460px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--lc-space-4);
  padding: var(--lc-space-8);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: var(--lc-radius-xl);
  background: rgba(15, 23, 42, 0.82);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36);
  color: #e2e8f0;
  text-align: center;
  backdrop-filter: blur(20px);
}

.screen-state__icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--lc-radius-xl);
  background: rgba(96, 165, 250, 0.12);
  color: #93c5fd;
}

.screen-state--error .screen-state__icon {
  background: rgba(248, 113, 113, 0.12);
  color: #fca5a5;
}

.screen-state--warning .screen-state__icon {
  background: rgba(251, 191, 36, 0.12);
  color: #fcd34d;
}

.screen-state__icon :deep(.el-icon) {
  font-size: 28px;
}

.screen-state__icon :deep(.is-loading) {
  animation: screen-state-rotate 1s linear infinite;
}

.screen-state__content h2 {
  margin: 0;
  color: #f8fafc;
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}

.screen-state__content p {
  margin: var(--lc-space-2) 0 0;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 22px;
}

.screen-state__detail {
  width: 100%;
  max-height: 150px;
  overflow: auto;
  margin: 0;
  padding: var(--lc-space-3);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: var(--lc-radius-lg);
  background: rgba(15, 23, 42, 0.72);
  color: #cbd5e1;
  font-size: 12px;
  line-height: 18px;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
}

.screen-state__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--lc-space-2);
  flex-wrap: wrap;
}

@keyframes screen-state-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
