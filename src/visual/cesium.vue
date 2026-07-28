<template>
  <div class="cesium-preview">
    <div class="preview-visual">
      <el-icon :size="48" color="#409EFF"><MapLocation /></el-icon>
      <div class="preview-title">Cesium GIS 地图</div>
      <div class="preview-desc">支持多种底图、图层叠加、3D模型加载</div>
    </div>
  </div>
</template>

<script setup>
import { MapLocation } from '@element-plus/icons-vue'
</script>

<style scoped>
.cesium-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 8px;
  padding: 20px;
}

.preview-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.preview-title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.preview-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}
</style>
