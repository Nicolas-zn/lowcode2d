<template>
  <div class="menu-brick" :class="[`menu-${direction}`]">
    <div v-for="(item, index) in menuItems" :key="index" class="menu-item"
      :class="{ active: index === currentPageIndex }" @click="handleClick(index)">
      <el-icon v-if="item.icon" :size="16">
        <component :is="item.icon" />
      </el-icon>
      <span class="menu-text">{{ item.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePanelStore } from '../stores/panelStore'

const props = defineProps({
  menuItems: {
    type: Array,
    default: () => [{ name: '首页', pageIndex: 0 }]
  },
  direction: {
    type: String,
    default: 'horizontal' // horizontal | vertical
  },
  activeColor: {
    type: String,
    default: '#409eff'
  },
  bgColor: {
    type: String,
    default: 'rgba(0, 10, 30, 0.85)'
  },
  textColor: {
    type: String,
    default: 'rgba(255, 255, 255, 0.75)'
  }
})

const panelStore = usePanelStore()
const currentPageIndex = computed(() => panelStore.currentPageIndex)

const handleClick = (index) => {
  panelStore.switchPage(index)
}
</script>

<style scoped>
.menu-brick {
  width: 100%;
  height: 100%;
  display: flex;
  background: v-bind(bgColor);
  border-radius: 4px;
  overflow: hidden;
  box-sizing: border-box;
}

.menu-horizontal {
  flex-direction: row;
  align-items: center;
  gap: 0;
}

.menu-vertical {
  flex-direction: column;
  gap: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 20px;
  cursor: pointer;
  color: v-bind(textColor);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.25s ease;
  white-space: nowrap;
  position: relative;
  flex-shrink: 0;
}

.menu-horizontal .menu-item {
  height: 100%;
}

.menu-vertical .menu-item {
  width: 100%;
  justify-content: flex-start;
  padding: 12px 20px;
}

.menu-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.menu-item.active {
  color: #fff;
  background: v-bind(activeColor);
}

.menu-horizontal .menu-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 3px;
  background: #fff;
  border-radius: 3px 3px 0 0;
}

.menu-vertical .menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: #fff;
  border-radius: 0 3px 3px 0;
}

.menu-text {
  letter-spacing: 1px;
}
</style>
