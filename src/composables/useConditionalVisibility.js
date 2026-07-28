import { computed, watch } from 'vue'
import { useVariableStore } from '../stores/variableStore'

/**
 * 条件显示 Composable
 * @param {Ref} component - 组件实例引用
 * @returns {Object} { isVisible }
 */
export function useConditionalVisibility(component) {
  const variableStore = useVariableStore()
  
  /**
   * 计算组件是否可见
   */
  const isVisible = computed(() => {
    // 如果没有配置条件，默认显示
    if (!component.value?.visibilityCondition) {
      return true
    }
    
    try {
      // 计算条件表达式
      const result = variableStore.evaluateExpression(component.value.visibilityCondition)
      return Boolean(result)
    } catch (error) {
      console.error('条件显示计算错误:', error)
      return true // 出错时默认显示
    }
  })
  
  return {
    isVisible
  }
}
