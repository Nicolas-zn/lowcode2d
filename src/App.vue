<template>
  <div class="app-container" :class="{
    'dark-theme': themeStore.isDark,
    'tech-theme': themeStore.isTech
  }">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useThemeStore } from './stores/themeStore'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})

// 监听主题变化，同步到 HTML 元素以支持 Element Plus
watch(() => themeStore.currentTheme, (theme) => {
  // 移除所有主题类
  document.documentElement.classList.remove('dark', 'tech')

  // 添加对应的主题类
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (theme === 'tech') {
    document.documentElement.classList.add('dark', 'tech') // 科技风也使用Element Plus的dark模式
  }
}, { immediate: true })
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
