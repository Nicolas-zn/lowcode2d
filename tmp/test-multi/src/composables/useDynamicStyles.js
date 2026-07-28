import { computed } from 'vue'
import { useVariableStore } from '../stores/variableStore'

/**
 * 动态样式绑定 Composable
 * @param {Ref} component - 组件实例引用
 * @returns {Object} { dynamicStyles }
 */
export function useDynamicStyles(component) {
  const variableStore = useVariableStore()
  
  /**
   * 计算动态样式
   */
  const dynamicStyles = computed(() => {
    const styles = {}
    
    // 如果没有配置动态样式，返回空对象
    if (!component.value?.dynamicStyles) {
      return styles
    }
    
    // 遍历动态样式配置
    Object.keys(component.value.dynamicStyles).forEach(styleKey => {
      const expression = component.value.dynamicStyles[styleKey]
      
      try {
        // 计算表达式
        const value = variableStore.evaluateExpression(expression)
        styles[styleKey] = value
      } catch (error) {
        console.error(`动态样式计算错误 [${styleKey}]:`, error)
      }
    })
    
    return styles
  })
  
  return {
    dynamicStyles
  }
}
