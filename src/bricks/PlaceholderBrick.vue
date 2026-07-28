<template>
  <div class="placeholder-brick"></div>
</template>

<script setup>
// 占位符组件，仅用于显示辅助线，不可交互
</script>

<style scoped>
.placeholder-brick {
  pointer-events: none;
  user-select: none;
  width: 100%;
  height: 100%;
  background: transparent;
  border: 2px dashed rgba(150, 150, 150, 0.6);
  border-radius: 4px;
}
</style>
