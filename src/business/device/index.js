/**
 * 设备业务组件库配置
 * 基于 api_list.md 中的设备接口
 */

// 从环境变量获取 API URL
const CHART_API_URL = import.meta.env.VITE_CHART_API_URL
const API_TOKEN = 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'

const deviceComponents = [
    {
        icon: 'bi-bar-chart-steps',
        name: '设备延迟Top10',
        type: 'HorizontalBarBrick',
        category: '设备',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/device/delay_top',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-steps',
        name: 'CPU性能TOP10',
        type: 'HorizontalBarBrick',
        category: '设备',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/device/top/cpu',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-steps',
        name: '内存性能TOP10',
        type: 'HorizontalBarBrick',
        category: '设备',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/device/top/memory',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-steps',
        name: '温度性能TOP10',
        type: 'HorizontalBarBrick',
        category: '设备',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/device/top/temp',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-graph-up',
        name: '设备历史性能',
        type: 'LineChartBrick',
        category: '设备',
        defaultWidth: 500,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/device/history_metrics',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    }
]

export { deviceComponents }
