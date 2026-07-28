import { ref, watch, onUnmounted } from 'vue'
import { api } from '../lib/api'

export function useApiData(apiConfig, refreshInterval = 0) {
    const apiData = ref(null)
    const loading = ref(false)
    const error = ref(null)
    let intervalId = null
    let wsConnection = null

    const clearTimeoutsAndSockets = () => {
        if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
        }
        if (wsConnection) {
            wsConnection.close()
            wsConnection = null
        }
    }

    const fetchData = async () => {
        // 如果没有配置 API，直接返回
        if (!apiConfig.value || !apiConfig.value.url) {
            apiData.value = null
            return
        }

        const isWs = apiConfig.value.protocol === 'WS' || apiConfig.value.url.startsWith('ws://') || apiConfig.value.url.startsWith('wss://')

        if (isWs) {
            if (!wsConnection) {
                loading.value = true
                
                // 将 http 转换为 ws (如果用户忘记改)
                let wsUrl = apiConfig.value.url
                if (wsUrl.startsWith('http')) {
                    wsUrl = wsUrl.replace('http', 'ws')
                }

                let fullUrl = apiConfig.value.suffix ? `${wsUrl}${apiConfig.value.suffix}` : wsUrl
                if (apiConfig.value.token) {
                    const separator = fullUrl.includes('?') ? '&' : '?'
                    fullUrl += `${separator}token=${apiConfig.value.token}`
                }
                
                try {
                    wsConnection = new WebSocket(fullUrl)
                    wsConnection.onmessage = (event) => {
                        try {
                            apiData.value = JSON.parse(event.data)
                        } catch(e) {
                            apiData.value = event.data
                        }
                        loading.value = false
                    }
                    wsConnection.onerror = (err) => {
                        error.value = 'WebSocket 错误'
                        loading.value = false
                    }
                    wsConnection.onclose = () => {
                        wsConnection = null
                        loading.value = false
                    }
                } catch (e) {
                    error.value = e.message
                    loading.value = false
                }
            }
            return
        }

        // HTTP逻辑
        loading.value = true
        error.value = null

        try {
            const data = await api.fetchData({
                url: apiConfig.value.url,
                suffix: apiConfig.value.suffix,
                method: apiConfig.value.method || 'GET',
                token: apiConfig.value.token
            })
            apiData.value = data
        } catch (err) {
            error.value = err.message
            console.error('API 请求失败:', err)
        } finally {
            loading.value = false
        }
    }

    // 监听 API 配置变化
    watch(apiConfig, (newConfig) => {
        if (newConfig && newConfig.url) {
            clearTimeoutsAndSockets()
            fetchData()

            const isWs = newConfig.protocol === 'WS' || newConfig.url.startsWith('ws://') || newConfig.url.startsWith('wss://')
            
            if (!isWs) {
                // 如果设置了刷新间隔（优先使用 API 配置中的 interval，否则使用传入的 refreshInterval）
                const interval = newConfig.interval !== undefined ? newConfig.interval : refreshInterval
                if (interval > 0) {
                    // 确保最低频率为 5 秒
                    const actualInterval = Math.max(5, interval) * 1000
                    intervalId = setInterval(fetchData, actualInterval)
                }
            }
        } else {
            // 如果清空了 API 配置，清除数据和定时器
            apiData.value = null
            clearTimeoutsAndSockets()
        }
    }, { deep: true, immediate: true })

    // 组件卸载时清除
    onUnmounted(() => {
        clearTimeoutsAndSockets()
    })

    return {
        apiData,
        loading,
        error,
        fetchData
    }
}

