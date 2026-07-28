import { onMounted, onUnmounted } from 'vue'
import { useEventBusStore } from '../stores/eventBusStore'
import { useVariableStore } from '../stores/variableStore'

/**
 * 组件事件处理 Composable
 * @param {Object} component - 组件实例
 * @param {Ref} elementRef - 组件DOM元素引用
 */
export function useComponentEvents(component, elementRef) {
  const eventBus = useEventBusStore()
  const variableStore = useVariableStore()
  
  // 存储事件监听器的取消函数和处理器
  const eventHandlers = []
  
  /**
   * 执行事件动作
   * @param {Object} action - 事件动作配置
   * @param {any} eventData - 事件数据
   */
  const executeAction = (action, eventData) => {
    try {
      switch (action.type) {
        case 'emit':
          // 发送事件到事件总线
          if (action.eventName) {
            eventBus.emit(action.eventName, eventData, component.id)
          }
          break
        
        case 'setVariable':
          // 设置变量
          if (action.variableName) {
            let value = action.variableValue
            // 如果是表达式，计算表达式
            if (value && value.startsWith('=')) {
              value = variableStore.evaluateExpression(value.substring(1))
            }
            variableStore.setVariable(action.variableName, value)
          }
          break
        
        case 'navigate':
          // 导航到URL
          if (action.url) {
            window.open(action.url, '_blank')
          }
          break
        
        case 'custom':
          // 执行自定义代码
          if (action.customCode) {
            const func = new Function('eventData', 'component', action.customCode)
            func(eventData, component)
          }
          break
      }
    } catch (error) {
      console.error('执行事件动作失败:', error)
    }
  }
  
  /**
   * 处理组件事件
   * @param {Object} event - 事件配置
   * @param {any} eventData - 事件数据
   */
  const handleEvent = (event, eventData) => {
    if (!event.enabled) return
    
    event.actions.forEach(action => {
      executeAction(action, eventData)
    })
  }
  
  // 初始化事件监听
  onMounted(() => {
    if (!component.events || !elementRef.value) return
    
    component.events.forEach(event => {
      if (!event.enabled) return
      
      const element = elementRef.value
      
      switch (event.eventType) {
        case 'click':
          const clickHandler = (e) => {
            handleEvent(event, { x: e.clientX, y: e.clientY })
          }
          element.addEventListener('click', clickHandler)
          eventHandlers.push({ element, type: 'click', handler: clickHandler })
          break
        
        case 'hover':
          const enterHandler = () => {
            handleEvent(event, { type: 'enter' })
          }
          const leaveHandler = () => {
            handleEvent(event, { type: 'leave' })
          }
          element.addEventListener('mouseenter', enterHandler)
          element.addEventListener('mouseleave', leaveHandler)
          eventHandlers.push({ element, type: 'mouseenter', handler: enterHandler })
          eventHandlers.push({ element, type: 'mouseleave', handler: leaveHandler })
          break
      }
    })
  })
  
  // 清理事件监听
  onUnmounted(() => {
    // 移除所有事件监听器
    eventHandlers.forEach(({ element, type, handler }) => {
      if (element) {
        element.removeEventListener(type, handler)
      }
    })
    // 清空数组
    eventHandlers.length = 0
  })
  
  return {
    handleEvent
  }
}
