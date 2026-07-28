<template>
  <svg :width="size" :height="size" viewBox="0 0 100 100" class="layout-icon">
    <!-- 背景 -->
    <rect x="0" y="0" width="100" height="100" fill="var(--el-fill-color-light)" rx="4" />
    
    <!-- 布局块 -->
    <rect
      v-for="(block, index) in blocks"
      :key="index"
      :x="block.x"
      :y="block.y"
      :width="block.width"
      :height="block.height"
      :fill="block.fill"
      :opacity="block.opacity"
      :stroke="block.stroke"
      :stroke-width="block.strokeWidth"
      rx="2"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  layout: {
    type: Array,
    required: true
  },
  size: {
    type: Number,
    default: 48
  }
})

// 将布局坐标转换为 SVG 坐标（1920x1080 -> 100x100）
// 增加间隔：缩小每个块的尺寸，增加视觉间距
const blocks = computed(() => {
  const GAP_SCALE = 0.92 // 缩小到92%，留出8%作为间隔
  const PADDING = 2 // 整体内边距
  
  return props.layout.map(item => {
    const x = (item.x / 1920) * 100
    const y = (item.y / 1080) * 100
    const width = (item.width / 1920) * 100
    const height = (item.height / 1080) * 100
    
    // 计算缩小后的尺寸和居中偏移
    const scaledWidth = width * GAP_SCALE
    const scaledHeight = height * GAP_SCALE
    const offsetX = (width - scaledWidth) / 2
    const offsetY = (height - scaledHeight) / 2
    
    return {
      x: x + offsetX + PADDING,
      y: y + offsetY + PADDING,
      width: scaledWidth - PADDING,
      height: scaledHeight - PADDING,
      fill: 'var(--el-color-primary)',
      opacity: 0.15,
      stroke: 'var(--el-color-primary)',
      strokeWidth: 1.2
    }
  })
})
</script>

<style scoped>
.layout-icon {
  display: block;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.layout-icon:hover {
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}
</style>
