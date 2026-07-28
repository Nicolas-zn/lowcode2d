<template>
  <div class="threejs-preview">
    <div class="preview-visual">
      <el-icon :size="48" color="#67C23A"><Box /></el-icon>
      <div class="preview-title">Three.js 3D 场景</div>
      <div class="preview-desc">支持3D模型渲染、场景编辑</div>
    </div>
  </div>
</template>

<script setup>
import { Box } from '@element-plus/icons-vue'
</script>

<style scoped>
.threejs-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #0d2137 50%, #1a3a2e 100%);
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
