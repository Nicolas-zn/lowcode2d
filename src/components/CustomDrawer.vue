<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="visible" class="drawer-mask" @click="handleMaskClick">
        <div class="drawer-container" :style="{ width: size }" @click.stop>
          <div class="drawer-header">
            <slot name="header">
              <span class="drawer-title">{{ title }}</span>
            </slot>
            <el-icon class="drawer-close" @click="handleClose">
              <Close />
            </el-icon>
          </div>
          <div class="drawer-body">
            <slot></slot>
          </div>
          <div class="drawer-footer" v-if="$slots.footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { Close } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: '450px' },
  closeOnClickModal: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'close'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleClose = () => {
  visible.value = false
  emit('close')
}

const handleMaskClick = () => {
  if (props.closeOnClickModal) {
    handleClose()
  }
}
</script>

<style scoped>
.drawer-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.42);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}

.drawer-container {
  height: 100%;
  background: var(--lc-bg-panel);
  box-shadow: -18px 0 45px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
}

.drawer-header {
  padding: var(--lc-space-5);
  border-bottom: 1px solid var(--lc-border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.drawer-title {
  font-weight: 600;
  font-size: var(--lc-font-size-title-md);
  line-height: var(--lc-line-height-title-md);
  color: var(--lc-text-primary);
}

.drawer-close {
  cursor: pointer;
  font-size: 20px;
  color: var(--lc-text-tertiary);
  transition: color 0.2s;
}

.drawer-close:hover {
  color: var(--el-color-primary);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--lc-space-5);
  padding-bottom: var(--lc-space-6);
  background: var(--lc-bg-page);
}

.drawer-footer {
  padding: var(--lc-space-4) var(--lc-space-5);
  background: var(--lc-bg-panel);
  border-top: 1px solid var(--lc-border-subtle);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--lc-space-3);
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-active .drawer-container,
.drawer-leave-active .drawer-container {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-container {
  transform: translateX(100%);
}

.drawer-leave-to .drawer-container {
  transform: translateX(100%);
}
</style>
