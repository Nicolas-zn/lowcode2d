import { ref, watch, onMounted, onUnmounted } from 'vue'
import { api } from '../lib/api'

export function useApiData(apiConfig, refreshInterval = 0) {
    const apiData = ref(null)
    const loading = ref(false)
    const error = ref(null)
    let intervalId = null

    const fetchData = async () => {
        // 如果没有配置 API，直接返回
        if (!apiConfig.value || !apiConfig.value.url) {
            apiData.value = null
            return
        }

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
            fetchData()

            // 清除旧的定时器
            if (intervalId) {
                clearInterval(intervalId)
                intervalId = null
            }

            // 如果设置了刷新间隔，启动定时刷新
            if (refreshInterval > 0) {
                intervalId = setInterval(fetchData, refreshInterval)
            }
        } else {
            // 如果清空了 API 配置，清除数据和定时器
            apiData.value = null
            if (intervalId) {
                clearInterval(intervalId)
                intervalId = null
            }
        }
    }, { deep: true, immediate: true })

    // 组件卸载时清除定时器
    onUnmounted(() => {
        if (intervalId) {
            clearInterval(intervalId)
        }
    })

    return {
        apiData,
        loading,
        error,
        fetchData
    }
}

