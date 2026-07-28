import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 事件总线 Store
 * 用于组件间的事件通信和联动
 */
export const useEventBusStore = defineStore('eventBus', () => {
  // 事件监听器映射
  const listeners = ref({})
  
  // 事件历史记录（用于调试）
  const eventHistory = ref([])
  
  // 最大历史记录数
  const MAX_HISTORY = 100
  
  /**
   * 发送事件
   * @param {string} eventName - 事件名称
   * @param {any} payload - 事件数据
   * @param {string} sourceComponentId - 源组件ID
   */
  const emit = (eventName, payload, sourceComponentId = null) => {
    // 记录事件历史
    eventHistory.value.unshift({
      eventName,
      payload,
      sourceComponentId,
      timestamp: Date.now()
    })
    
    // 限制历史记录数量
    if (eventHistory.value.length > MAX_HISTORY) {
      eventHistory.value = eventHistory.value.slice(0, MAX_HISTORY)
    }
    
    // 触发所有监听器
    const eventListeners = listeners.value[eventName] || []
    eventListeners.forEach(listener => {
      try {
        listener.callback(payload, sourceComponentId)
      } catch (error) {
        console.error(`事件处理错误 [${eventName}]:`, error)
      }
    })
  }
  
  /**
   * 监听事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @param {string} listenerId - 监听器ID（通常是组件ID）
   * @returns {Function} 取消监听的函数
   */
  const on = (eventName, callback, listenerId) => {
    if (!listeners.value[eventName]) {
      listeners.value[eventName] = []
    }
    
    const listener = { callback, listenerId }
    listeners.value[eventName].push(listener)
    
    // 返回取消监听的函数
    return () => off(eventName, listenerId)
  }
  
  /**
   * 取消监听事件
   * @param {string} eventName - 事件名称
   * @param {string} listenerId - 监听器ID
   */
  const off = (eventName, listenerId) => {
    if (!listeners.value[eventName]) return
    
    listeners.value[eventName] = listeners.value[eventName].filter(
      listener => listener.listenerId !== listenerId
    )
    
    // 如果没有监听器了，删除该事件
    if (listeners.value[eventName].length === 0) {
      delete listeners.value[eventName]
    }
  }
  
  /**
   * 移除组件的所有监听器
   * @param {string} componentId - 组件ID
   */
  const offComponent = (componentId) => {
    Object.keys(listeners.value).forEach(eventName => {
      listeners.value[eventName] = listeners.value[eventName].filter(
        listener => listener.listenerId !== componentId
      )
      
      // 如果没有监听器了，删除该事件
      if (listeners.value[eventName].length === 0) {
        delete listeners.value[eventName]
      }
    })
  }
  
  /**
   * 清除所有监听器
   */
  const clear = () => {
    listeners.value = {}
  }
  
  /**
   * 清除事件历史
   */
  const clearHistory = () => {
    eventHistory.value = []
  }
  
  return {
    listeners,
    eventHistory,
    emit,
    on,
    off,
    offComponent,
    clear,
    clearHistory
  }
})
