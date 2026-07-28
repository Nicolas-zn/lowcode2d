import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 操作类型枚举
export const HistoryActionType = {
  ADD_COMPONENT: 'add_component',
  REMOVE_COMPONENT: 'remove_component',
  UPDATE_COMPONENT: 'update_component',
  MOVE_COMPONENT: 'move_component',
  RESIZE_COMPONENT: 'resize_component',
  ROTATE_COMPONENT: 'rotate_component',
  CLEAR_ALL: 'clear_all',
  LOAD_TEMPLATE: 'load_template',
  APPLY_LAYOUT: 'apply_layout',
  ADD_PAGE: 'add_page',
  REMOVE_PAGE: 'remove_page',
  RENAME_PAGE: 'rename_page',
  ADD_PROJECT: 'add_project',
  REMOVE_PROJECT: 'remove_project',
  UPDATE_PROJECT_SETTINGS: 'update_project_settings'
}

export const useHistoryStore = defineStore('history', () => {
  // 历史记录栈
  const history = ref([])
  // 当前历史记录索引
  const currentIndex = ref(-1)
  // 最大历史记录数
  const maxHistory = ref(50)
  // 是否正在执行撤销/重做操作（防止记录撤销/重做本身）
  const isUndoRedoing = ref(false)

  // 是否可以撤销
  const canUndo = computed(() => currentIndex.value > 0)

  // 是否可以重做
  const canRedo = computed(() => currentIndex.value < history.value.length - 1)

  // 获取当前操作描述
  const currentAction = computed(() => {
    if (currentIndex.value >= 0 && currentIndex.value < history.value.length) {
      return history.value[currentIndex.value].action
    }
    return null
  })

  // 获取下一个可撤销的操作描述
  const undoAction = computed(() => {
    if (canUndo.value) {
      return history.value[currentIndex.value].action
    }
    return null
  })

  // 获取下一个可重做的操作描述
  const redoAction = computed(() => {
    if (canRedo.value) {
      return history.value[currentIndex.value + 1].action
    }
    return null
  })

  // 添加历史记录
  const pushHistory = (snapshot, action = {}) => {
    // 如果正在执行撤销/重做，不记录
    if (isUndoRedoing.value) return

    // 删除当前索引之后的所有记录（因为用户做了新操作）
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }

    // 添加新记录
    history.value.push({
      timestamp: Date.now(),
      snapshot: JSON.parse(JSON.stringify(snapshot)), // 深拷贝
      action: {
        type: action.type || 'unknown',
        description: action.description || '未知操作',
        componentId: action.componentId || null,
        componentName: action.componentName || null,
        details: action.details || {}
      }
    })

    // 限制历史记录数量
    if (history.value.length > maxHistory.value) {
      history.value.shift()
    } else {
      currentIndex.value++
    }
  }

  const resetHistory = (initialSnapshot = null, action = {}) => {
    history.value = []
    currentIndex.value = -1
    if (initialSnapshot) {
      pushHistory(initialSnapshot, {
        type: action.type || 'init',
        description: action.description || '初始化画布',
        ...action
      })
    }
  }

  return {
    history,
    currentIndex,
    canUndo,
    canRedo,
    isUndoRedoing,
    currentAction,
    undoAction,
    redoAction,
    pushHistory,
    resetHistory
  }
})
