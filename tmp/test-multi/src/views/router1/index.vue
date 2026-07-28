<template>
  <div class="page-container" style="width: 100vw; height: 100vh; overflow: hidden; background: #0f1535;">
    <div class="canvas-panel" :style="{
      width: '1920px',
      height: '1080px',
      transform: `scale(${scaleX}, ${scaleY})`,
      transformOrigin: 'top left',
      position: 'relative',
      backgroundColor: '#0f1535',
      
    }">
      <EChartBrick v-bind="props_0" :style='{"position":"absolute","left":"20px","top":"120px","width":"600px","height":"400px","zIndex":1}' />
    </div>
  </div>
</template>

<script setup>
import EChartBrick from '@/bricks/EChartBrick.vue'

import { ref, onMounted, onUnmounted } from 'vue'
const scaleX = ref(1)
const scaleY = ref(1)

const calculateScale = () => {
    scaleX.value = window.innerWidth / 1920
    scaleY.value = window.innerHeight / 1080
}

onMounted(() => {
    calculateScale()
    window.addEventListener('resize', calculateScale)
})

onUnmounted(() => {
    window.removeEventListener('resize', calculateScale)
})


const props_0 = {
  "title": "页面1-销售数据",
  "chartType": "bar",
  "data": {
    "xAxis": [
      "周一",
      "周二",
      "周三"
    ],
    "series": [
      {
        "name": "销售额",
        "data": [
          120,
          200,
          150
        ]
      }
    ]
  }
}
</script>

<style scoped>
</style>