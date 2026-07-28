/**
 * 日志业务组件库配置
 * 基于 api_list.md 中的日志接口
 */

// 从环境变量获取 API URL
const CHART_API_URL = import.meta.env.VITE_CHART_API_URL
const API_TOKEN = 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'

const logComponents = [
    // Syslog 相关
    {
        icon: 'bi-table',
        name: 'Syslog列表',
        type: 'TableBrick',
        category: '日志',
        defaultWidth: 600,
        defaultHeight: 400,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/syslog/list',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: 'Syslog类型分布',
        type: 'PieChartBrick',
        category: '日志',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/syslog/by_type',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: 'Syslog模块分布',
        type: 'PieChartBrick',
        category: '日志',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/syslog/by_module',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-graph-up',
        name: 'Syslog趋势',
        type: 'LineChartBrick',
        category: '日志',
        defaultWidth: 500,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/syslog/trend_by_day',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-fill',
        name: 'Syslog设备排行',
        type: 'EChartBrick',
        category: '日志',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/syslog/top_devices',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // Trap 相关
    {
        icon: 'bi-graph-up',
        name: 'Trap趋势',
        type: 'LineChartBrick',
        category: '日志',
        defaultWidth: 500,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/trap/trend_by_day',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-fill',
        name: 'Trap设备排行',
        type: 'EChartBrick',
        category: '日志',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/trap/top_devices',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    }
]

export { logComponents }
