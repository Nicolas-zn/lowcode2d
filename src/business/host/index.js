/**
 * 主机业务组件库配置
 * 基于 api_list.md 中的主机接口
 */

// 从环境变量获取 API URL
const CHART_API_URL = import.meta.env.VITE_CHART_API_URL
const API_TOKEN = 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'

const hostComponents = [
    {
        icon: 'bi-bar-chart-steps',
        name: '主机CPU TOP10',
        type: 'HorizontalBarBrick',
        category: '主机',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/host/top/cpu',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-steps',
        name: '负载TOP10',
        type: 'HorizontalBarBrick',
        category: '主机',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/host/top/load1',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-steps',
        name: '内存TOP10',
        type: 'HorizontalBarBrick',
        category: '主机',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/host/top/memory',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-steps',
        name: '磁盘TOP10',
        type: 'HorizontalBarBrick',
        category: '主机',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/host/top/disk',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-steps',
        name: '外网延迟TOP10',
        type: 'HorizontalBarBrick',
        category: '主机',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/host/top/ping',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-steps',
        name: '连接数TOP10',
        type: 'HorizontalBarBrick',
        category: '主机',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/host/top/connection_count',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-graph-up',
        name: '主机历史性能',
        type: 'LineChartBrick',
        category: '主机',
        defaultWidth: 500,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/host/history_metrics',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    }
]

export { hostComponents }
