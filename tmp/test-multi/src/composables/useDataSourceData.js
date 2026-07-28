import { ref, watch, onUnmounted, computed } from 'vue'
import { useDataSourceStore } from '../stores/dataSourceStore'
import { applyPathMapping, getValueByPath } from '../utils/dataTransform'

/**
 * 使用数据源获取数据的 Composable
 * @param {Ref<string|null>} dataSourceIdRef - 数据源ID的响应式引用
 * @param {Ref<Object|null>} dataTransformRef - 数据转换配置的响应式引用
 * @param {number} refreshInterval - 刷新间隔（毫秒），0表示不自动刷新
 * @returns {Object} { data, loading, error, fetchData }
 */
export function useDataSourceData(dataSourceIdRef, dataTransformRef = null, refreshInterval = 0) {
  const dataSourceStore = useDataSourceStore()
  
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  let timer = null
  let wsWatcher = null
  
  // 应用数据转换
  const applyTransform = (rawData) => {
    if (!dataTransformRef || !dataTransformRef.value || !dataTransformRef.value.enabled) {
      return rawData
    }
    
    const config = dataTransformRef.value
    let transformedData = rawData
    
    // 应用路径映射
    if (config.pathMapping && Object.keys(config.pathMapping).length > 0) {
      transformedData = applyPathMapping(rawData, config.pathMapping)
    }
    
    // 应用自定义转换函数
    if (config.transformFunction) {
      try {
        const transformFn = new Function('data', config.transformFunction)
        transformedData = transformFn(transformedData)
      } catch (err) {
        console.error('执行转换函数失败:', err)
      }
    }
    
    return transformedData
  }
  
  // 获取数据的函数
  const fetchData = async () => {
    const dataSourceId = dataSourceIdRef.value
    
    if (!dataSourceId) {
      data.value = null
      loading.value = false
      error.value = null
      return
    }
    
    try {
      loading.value = true
      error.value = null
      
      const result = await dataSourceStore.fetchData(dataSourceId)
      data.value = applyTransform(result)
    } catch (err) {
      console.error('获取数据源数据失败:', err)
      error.value = err.message || '获取数据失败'
      data.value = null
    } finally {
      loading.value = false
    }
  }
  
  // 监听数据源ID变化
  watch(dataSourceIdRef, (newId, oldId) => {
    if (newId !== oldId) {
      // 清除旧的定时器和监听器
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      if (wsWatcher) {
        wsWatcher()
        wsWatcher = null
      }
      
      // 获取新数据
      if (newId) {
        const dataSource = dataSourceStore.dataSources.find(ds => ds.id === newId)
        
        fetchData()
        
        // 如果是 WebSocket 类型，监听实时数据
        if (dataSource && dataSource.type === 'websocket') {
          wsWatcher = watch(
            () => dataSourceStore.wsData[newId],
            (newData) => {
              if (newData) {
                data.value = applyTransform(newData)
              }
            },
            { deep: true }
          )
        }
        // 否则设置定时刷新
        else if (refreshInterval > 0) {
          timer = setInterval(fetchData, refreshInterval)
        }
      } else {
        data.value = null
        loading.value = false
        error.value = null
      }
    }
  }, { immediate: true })
  
  // 组件卸载时清理
  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (wsWatcher) {
      wsWatcher()
      wsWatcher = null
    }
  })
  
  return {
    data,
    loading,
    error,
    fetchData
  }
}
