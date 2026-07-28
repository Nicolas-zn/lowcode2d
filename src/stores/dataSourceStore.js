import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createRequesterDataSourceConfig } from '../utils/requester.js'
import { transformData } from '../utils/dataTransform.js'

const defaultTransformConfig = () => ({
  enabled: false,
  code: `function transform(data) {
  return data;
}`
})

const normalizeTransformConfig = (transform = {}) => ({
  ...defaultTransformConfig(),
  ...transform,
  script: {
    enabled: transform.enabled || transform.script?.enabled || false,
    code: transform.code || transform.script?.code || defaultTransformConfig().code
  }
})

export const useDataSourceStore = defineStore('dataSource', () => {
  // 请求器列表：用于统一维护基础地址、默认 Header 和认证方式
  const requesters = ref([
    {
      id: 'default',
      name: '默认请求器',
      baseUrl: 'http://localhost:3001',
      headers: {},
      auth: { type: 'none' },
      timeout: 15000,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ])

  // 数据源列表
  const dataSources = ref([])
  
  // 数据缓存
  const dataCache = ref({})

  // 最近一次请求状态，按 dataSourceId 持久化
  const lastRequestResults = ref({})

  // 请求历史，按 dataSourceId 保存最近 20 次调试记录
  const requestHistories = ref({})
  
  // WebSocket 连接管理
  const wsConnections = ref({})
  
  // WebSocket 数据存储
  const wsData = ref({})
  
  // 添加数据源
  const addDataSource = (dataSource) => {
    const newDataSource = {
      id: dataSource.id || Date.now() + Math.random(),
      name: dataSource.name,
      type: dataSource.type || 'api', // api, mock, websocket
      config: dataSource.config || {},
      requesterId: dataSource.requesterId || null,
      requestConfig: dataSource.requestConfig || null,
      mockData: dataSource.mockData || null,
      cacheEnabled: dataSource.cacheEnabled || false,
      cacheDuration: dataSource.cacheDuration || 60000, // 默认60秒
      retryEnabled: dataSource.retryEnabled || false,
      retryCount: dataSource.retryCount || 3,
      retryDelay: dataSource.retryDelay || 1000,
      transform: normalizeTransformConfig(dataSource.transform),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    dataSources.value.push(newDataSource)
    return newDataSource
  }

  const addApiDataSource = ({
    name,
    requesterId,
    method = 'GET',
    path = '',
    queryRows = [],
    headerRows = [],
    body = null,
    mapping = {}
  }) => {
    return addDataSource({
      name: name || '未命名数据源',
      type: 'api',
      requesterId: requesterId || getRequester()?.id || null,
      requestConfig: {
        method,
        path,
        queryRows,
        headerRows,
        body,
        mapping
      }
    })
  }

  const addRequester = (requester) => {
    const newRequester = {
      id: requester.id || `requester_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: requester.name || '未命名请求器',
      baseUrl: requester.baseUrl || '',
      headers: requester.headers || {},
      auth: requester.auth || { type: 'none' },
      timeout: requester.timeout || 15000,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    requesters.value.push(newRequester)
    return newRequester
  }

  const updateRequester = (id, updates) => {
    const index = requesters.value.findIndex(requester => requester.id === id)
    if (index !== -1) {
      requesters.value[index] = {
        ...requesters.value[index],
        ...updates,
        updatedAt: Date.now()
      }
    }
  }

  const removeRequester = (id) => {
    if (id === 'default') return
    const index = requesters.value.findIndex(requester => requester.id === id)
    if (index !== -1) {
      requesters.value.splice(index, 1)
      dataSources.value.forEach((dataSource) => {
        if (dataSource.requesterId === id) {
          dataSource.requesterId = null
        }
      })
    }
  }

  const getRequester = (id) => {
    return requesters.value.find(requester => requester.id === id) || requesters.value[0] || null
  }
  
  // 更新数据源
  const updateDataSource = (id, updates) => {
    const index = dataSources.value.findIndex(ds => ds.id === id)
    if (index !== -1) {
      dataSources.value[index] = {
        ...dataSources.value[index],
        ...updates,
        updatedAt: Date.now()
      }
    }
  }

  const updateDataSourceTransform = (id, transform) => {
    updateDataSource(id, {
      transform: normalizeTransformConfig(transform)
    })
  }

  const applyDataSourceTransform = (dataSource, data) => {
    const transform = normalizeTransformConfig(dataSource.transform)
    if (!transform.enabled || !transform.code) return data

    return transformData(data, {
      script: {
        enabled: true,
        code: transform.code
      }
    })
  }

  const appendRequestHistory = (dataSourceId, result) => {
    if (!requestHistories.value[dataSourceId]) {
      requestHistories.value[dataSourceId] = []
    }

    requestHistories.value[dataSourceId].unshift({
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      status: result.status,
      title: result.title,
      message: result.message,
      statusCode: result.statusCode ?? null,
      duration: result.duration ?? null,
      method: result.method || '',
      url: result.url || '',
      requestedAt: result.requestedAt || Date.now(),
      error: result.error || ''
    })

    requestHistories.value[dataSourceId] = requestHistories.value[dataSourceId].slice(0, 20)
  }

  const setLastRequestResult = (dataSourceId, result, options = {}) => {
    lastRequestResults.value[dataSourceId] = {
      ...result,
      dataSourceId,
      updatedAt: Date.now()
    }

    if (options.recordHistory !== false) {
      appendRequestHistory(dataSourceId, lastRequestResults.value[dataSourceId])
    }
  }

  const clearLastRequestResult = (dataSourceId) => {
    delete lastRequestResults.value[dataSourceId]
    delete requestHistories.value[dataSourceId]
  }

  const clearRequestHistory = (dataSourceId) => {
    delete requestHistories.value[dataSourceId]
  }
  
  // 删除数据源
  const removeDataSource = (id) => {
    const index = dataSources.value.findIndex(ds => ds.id === id)
    if (index !== -1) {
      dataSources.value.splice(index, 1)
      // 清除相关缓存
      delete dataCache.value[id]
      clearLastRequestResult(id)
      // 关闭 WebSocket 连接
      disconnectWebSocket(id)
    }
  }
  
  // 连接 WebSocket
  const connectWebSocket = (dataSourceId) => {
    const dataSource = dataSources.value.find(ds => ds.id === dataSourceId)
    if (!dataSource || dataSource.type !== 'websocket') {
      return
    }
    
    // 如果已经连接，先断开
    if (wsConnections.value[dataSourceId]) {
      disconnectWebSocket(dataSourceId)
    }
    
    try {
      const ws = new WebSocket(dataSource.config.url)
      
      ws.onopen = () => {
        console.log(`WebSocket 连接成功: ${dataSource.name}`)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          wsData.value[dataSourceId] = data
        } catch (error) {
          console.error('WebSocket 数据解析失败:', error)
        }
      }
      
      ws.onerror = (error) => {
        console.error(`WebSocket 错误: ${dataSource.name}`, error)
      }
      
      ws.onclose = () => {
        console.log(`WebSocket 连接关闭: ${dataSource.name}`)
        delete wsConnections.value[dataSourceId]
      }
      
      wsConnections.value[dataSourceId] = ws
    } catch (error) {
      console.error('WebSocket 连接失败:', error)
      throw error
    }
  }
  
  // 断开 WebSocket
  const disconnectWebSocket = (dataSourceId) => {
    const ws = wsConnections.value[dataSourceId]
    if (ws) {
      ws.close()
      delete wsConnections.value[dataSourceId]
      delete wsData.value[dataSourceId]
    }
  }
  
  // 获取数据（带缓存和重试）
  const fetchData = async (dataSourceId) => {
    const dataSource = dataSources.value.find(ds => ds.id === dataSourceId)
    if (!dataSource) {
      throw new Error('数据源不存在')
    }
    
    // 如果是 Mock 数据，直接返回
    if (dataSource.type === 'mock') {
      return dataSource.mockData
    }
    
    // 如果是 WebSocket，返回最新数据
    if (dataSource.type === 'websocket') {
      // 如果还没有连接，先连接
      if (!wsConnections.value[dataSourceId]) {
        connectWebSocket(dataSourceId)
      }
      return wsData.value[dataSourceId] || null
    }
    
    // 检查缓存
    if (dataSource.cacheEnabled && dataCache.value[dataSourceId]) {
      const cached = dataCache.value[dataSourceId]
      const now = Date.now()
      if (now - cached.timestamp < dataSource.cacheDuration) {
        return cached.data
      }
    }
    
    const requester = dataSource.requesterId ? getRequester(dataSource.requesterId) : null
    const requestConfig = requester && dataSource.requestConfig
      ? createRequesterDataSourceConfig({ requester, requestConfig: dataSource.requestConfig })
      : dataSource.config

    if (!requestConfig?.url) {
      throw new Error('请求地址未配置')
    }

    // 发起请求（带重试）
    let lastError = null
    const maxRetries = dataSource.retryEnabled ? dataSource.retryCount : 1
    
    for (let i = 0; i < maxRetries; i++) {
      const requestedAt = Date.now()
      const startedAt = performance.now()
      let statusCode = null
      try {
        const response = await fetch(requestConfig.url, {
          method: requestConfig.method || 'GET',
          headers: requestConfig.headers || {},
          body: requestConfig.body ? JSON.stringify(requestConfig.body) : undefined
        })

        statusCode = response.status
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const rawData = await response.json()
        const transformedData = applyDataSourceTransform(dataSource, rawData)
        const duration = Math.round(performance.now() - startedAt)
        
        // 缓存数据
        if (dataSource.cacheEnabled) {
          dataCache.value[dataSourceId] = {
            data: transformedData,
            timestamp: Date.now()
          }
        }

        setLastRequestResult(dataSourceId, {
          status: 'success',
          title: `HTTP ${response.status}`,
          message: dataSource.name || '数据源',
          detail: formatResultDetail(transformedData),
          rawData,
          transformedData,
          error: '',
          statusCode,
          duration,
          requestedAt,
          method: requestConfig.method || 'GET',
          url: requestConfig.url
        })

        return transformedData
      } catch (error) {
        error.statusCode = error.statusCode ?? statusCode
        error.duration = Math.round(performance.now() - startedAt)
        error.requestedAt = requestedAt
        error.method = requestConfig.method || 'GET'
        error.url = requestConfig.url
        lastError = error
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, dataSource.retryDelay))
        }
      }
    }

    setLastRequestResult(dataSourceId, {
      status: 'failed',
      title: '数据源请求失败',
      message: dataSource.name || '数据源',
      detail: lastError?.message || '未知错误',
      rawData: null,
      transformedData: null,
      error: lastError?.message || '未知错误',
      statusCode: lastError?.statusCode ?? null,
      duration: lastError?.duration ?? null,
      requestedAt: lastError?.requestedAt || Date.now(),
      method: lastError?.method || requestConfig.method || 'GET',
      url: lastError?.url || requestConfig.url
    })

    throw lastError
  }

  const previewDataSourceTransform = (dataSourceId, inputData) => {
    const dataSource = dataSources.value.find(ds => ds.id === dataSourceId)
    if (!dataSource) throw new Error('数据源不存在')
    return applyDataSourceTransform(dataSource, inputData)
  }

  const formatResultDetail = (value) => {
    if (value === null || value === undefined || value === '') return '空响应'
    if (typeof value === 'string') return value
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  
  return {
    requesters,
    dataSources,
    dataCache,
    lastRequestResults,
    requestHistories,
    wsConnections,
    wsData,
    addRequester,
    updateRequester,
    removeRequester,
    getRequester,
    addDataSource,
    addApiDataSource,
    updateDataSource,
    updateDataSourceTransform,
    previewDataSourceTransform,
    setLastRequestResult,
    clearLastRequestResult,
    clearRequestHistory,
    removeDataSource,
    fetchData,
    connectWebSocket,
    disconnectWebSocket
  }
}, {
  persist: {
    pick: ['requesters', 'dataSources', 'lastRequestResults', 'requestHistories']
  }
})
