<template>
  <div class="history-panel">
    <div class="history-header">
      <h3>历史记录</h3>
      <el-button size="small" text @click="clearHistory">清空</el-button>
    </div>

    <div class="history-list">
      <div v-for="(record, index) in displayHistory" :key="index"
        :class="['history-item', { 'is-current': getActualIndex(index) === historyStore.currentIndex }]"
        @click="jumpToHistory(index)">
        <div class="history-icon">
          <el-icon>
            <component :is="getActionIcon(record.action.type)" />
          </el-icon>
        </div>
        <div class="history-content">
          <div class="history-description">{{ record.action.description }}</div>
          <div class="history-time">{{ formatTime(record.timestamp) }}</div>
        </div>
      </div>

      <el-empty v-if="displayHistory.length === 0" description="暂无历史记录" :image-size="60" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHistoryStore } from '../stores/historyStore'
import { usePanelStore } from '../stores/panelStore'
import {
  Plus,
  Delete,
  Rank,
  FullScreen,
  DocumentCopy,
  FolderOpened,
  RefreshRight,
  Files,
  Setting
} from '@element-plus/icons-vue'

const historyStore = useHistoryStore()
const panelStore = usePanelStore()

// 显示的历史记录（倒序）
const displayHistory = computed(() => {
  return [...historyStore.history].reverse()
})

// 获取操作图标
const getActionIcon = (type) => {
  const iconMap = {
    'add_component': Plus,
    'remove_component': Delete,
    'move_component': Rank,
    'resize_component': FullScreen,
    'rotate_component': RefreshRight,
    'clear_all': Delete,
    'load_template': FolderOpened,
    'apply_layout': DocumentCopy,
    'add_page': Files,
    'remove_page': Delete,
    'rename_page': Files,
    'add_project': FolderOpened,
    'remove_project': Delete,
    'update_project_settings': Setting
  }
  return iconMap[type] || DocumentCopy
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getActualIndex = (displayIndex) => {
  return historyStore.history.length - 1 - displayIndex
}

// 跳转到指定历史记录
const jumpToHistory = (displayIndex) => {
  const actualIndex = getActualIndex(displayIndex)

  if (actualIndex === historyStore.currentIndex) return

  historyStore.isUndoRedoing = true
  historyStore.currentIndex = actualIndex

  const snapshot = historyStore.history[actualIndex].snapshot
  panelStore.restoreHistorySnapshot(snapshot)

  historyStore.isUndoRedoing = false
}

// 清空历史记录
const clearHistory = () => {
  historyStore.history = []
  historyStore.currentIndex = -1
  panelStore.initHistory()
}
</script>

<style scoped>
.history-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.history-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--color-bg-secondary);
}

.history-item:hover {
  background: var(--color-bg-tertiary);
  transform: translateX(4px);
}

.history-item.is-current {
  background: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
}

.history-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-description {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
