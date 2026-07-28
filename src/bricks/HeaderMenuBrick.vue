<template>
  <div class="header-menu-brick">
    <!-- 左侧菜单 -->
    <div class="menu-side menu-left">
      <div v-for="(item, index) in leftItems" :key="index" class="menu-item"
        :class="{ active: item.pageIndex === currentPageIndex }" @click="handleClick(item.pageIndex)">
        <span class="menu-text">{{ item.name }}</span>
      </div>
    </div>

    <!-- 中间标题 -->
    <div class="header-center">
      <div class="header-title" :style="titleStyle">{{ title }}</div>
    </div>

    <!-- 右侧菜单 -->
    <div class="menu-side menu-right">
      <div v-for="(item, index) in rightItems" :key="index" class="menu-item"
        :class="{ active: item.pageIndex === currentPageIndex }" @click="handleClick(item.pageIndex)">
        <span class="menu-text">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePanelStore } from '../stores/panelStore'

const props = defineProps({
  title: {
    type: String,
    default: '大屏可视化项目'
  },
  titleColor: {
    type: String,
    default: '#ffffff'
  },
  titleSize: {
    type: Number,
    default: 32
  },
  menuItems: {
    type: Array,
    default: () => [
      { name: '首页', pageIndex: 0 },
      { name: '数据监控', pageIndex: 1 }
    ]
  },
  activeColor: {
    type: String,
    default: '#4ab2e4'
  },
  textColor: {
    type: String,
    default: 'rgba(255, 255, 255, 0.75)'
  },
  bgHeight: {
    type: String,
    default: '80px'
  }
})

const panelStore = usePanelStore()
const currentPageIndex = computed(() => panelStore.currentPageIndex)

// 根据 items 均分为左右两端
const processedItems = computed(() => {
  return props.menuItems
})

const leftItems = computed(() => {
  const mid = Math.ceil(processedItems.value.length / 2)
  return processedItems.value.slice(0, mid)
})

const rightItems = computed(() => {
  const mid = Math.ceil(processedItems.value.length / 2)
  return processedItems.value.slice(mid)
})

const titleStyle = computed(() => ({
  color: props.titleColor,
  fontSize: `${props.titleSize}px`
}))

const handleClick = (index) => {
  panelStore.switchPage(index)
}
</script>

<style scoped>
.header-menu-brick {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  /* 典型的顶部导航栏背景：中间突出或者简单的装饰条 */
  background: linear-gradient(180deg, rgba(0, 16, 40, 0.9) 0%, rgba(0, 16, 40, 0) 100%);
  position: relative;
  box-sizing: border-box;
  padding: 0 40px;
}

.menu-side {
  display: flex;
  align-items: center;
  flex: 1;
}

.menu-left {
  justify-content: flex-end;
  padding-right: 60px;
  gap: 30px;
}

.menu-right {
  justify-content: flex-start;
  padding-left: 60px;
  gap: 30px;
}

.header-center {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  /* 添加一些两边的装饰效果 */
}

.header-center::before,
.header-center::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 50px;
  height: 2px;
  background: linear-gradient(90deg, transparent, v-bind(activeColor));
}

.header-center::before {
  right: 100%;
  margin-right: 10px;
  background: linear-gradient(90deg, transparent, v-bind(activeColor));
}

.header-center::after {
  left: 100%;
  margin-left: 10px;
  background: linear-gradient(270deg, transparent, v-bind(activeColor));
}

.header-title {
  font-weight: bold;
  letter-spacing: 4px;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px v-bind(activeColor);
}

.menu-item {
  color: v-bind(textColor);
  font-size: 16px;
  font-weight: 500;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 2px;
  position: relative;
}

.menu-item:hover {
  text-shadow: 0 0 10px v-bind(activeColor);
  color: #fff;
  transform: translateY(-2px);
}

.menu-item.active {
  color: #fff;
  font-weight: bold;
  text-shadow: 0 0 15px v-bind(activeColor);
}

.menu-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 3px;
  background: v-bind(activeColor);
  border-radius: 2px;
  box-shadow: 0 0 8px v-bind(activeColor);
}
</style>
