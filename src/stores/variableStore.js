import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 变量管理 Store
 * 用于管理全局变量和表达式计算
 */
export const useVariableStore = defineStore('variable', () => {
  // 全局变量
  const variables = ref({})
  
  // 变量变化历史（用于调试）
  const changeHistory = ref([])
  
  /**
   * 设置变量
   * @param {string} name - 变量名
   * @param {any} value - 变量值
   */
  const setVariable = (name, value) => {
    const oldValue = variables.value[name]
    variables.value[name] = value
    
    // 记录变化历史
    changeHistory.value.unshift({
      name,
      oldValue,
      newValue: value,
      timestamp: Date.now()
    })
    
    // 限制历史记录
    if (changeHistory.value.length > 100) {
      changeHistory.value = changeHistory.value.slice(0, 100)
    }
  }
  
  /**
   * 获取变量
   * @param {string} name - 变量名
   * @returns {any} 变量值
   */
  const getVariable = (name) => {
    return variables.value[name]
  }
  
  /**
   * 删除变量
   * @param {string} name - 变量名
   */
  const deleteVariable = (name) => {
    delete variables.value[name]
  }
  
  /**
   * 批量设置变量
   * @param {Object} vars - 变量对象
   */
  const setVariables = (vars) => {
    Object.keys(vars).forEach(key => {
      setVariable(key, vars[key])
    })
  }
  
  /**
   * 清空所有变量
   */
  const clearVariables = () => {
    variables.value = {}
  }
  
  /**
   * 计算表达式
   * @param {string} expression - 表达式字符串
   * @returns {any} 计算结果
   */
  const evaluateExpression = (expression) => {
    if (!expression) return null
    
    try {
      // 创建一个安全的执行环境
      const func = new Function(...Object.keys(variables.value), `return ${expression}`)
      return func(...Object.values(variables.value))
    } catch (error) {
      console.error('表达式计算错误:', error)
      return null
    }
  }
  
  return {
    variables,
    changeHistory,
    setVariable,
    getVariable,
    deleteVariable,
    setVariables,
    clearVariables,
    evaluateExpression
  }
})
