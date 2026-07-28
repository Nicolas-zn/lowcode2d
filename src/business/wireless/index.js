/**
 * 无线业务组件库配置
 * 基于 api_list.md 中的无线接口
 */

// 从环境变量获取 API URL
const CHART_API_URL = import.meta.env.VITE_CHART_API_URL
const API_TOKEN = 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'

const wirelessComponents = [
    // 饼图
    {
        icon: 'bi-pie-chart-fill',
        name: 'AC状态分布',
        type: 'PieChartBrick',
        category: '无线',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/ac/by_status',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: 'AC类型分布',
        type: 'PieChartBrick',
        category: '无线',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/ac/by_type',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: 'AC组分布',
        type: 'PieChartBrick',
        category: '无线',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/ac/by_group',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: 'AC区域分布',
        type: 'PieChartBrick',
        category: '无线',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/ac/by_area',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 柱状图
    {
        icon: 'bi-bar-chart-fill',
        name: 'AC CPU排行',
        type: 'EChartBrick',
        category: '无线',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/ac/cpu_top',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-fill',
        name: 'AC内存排行',
        type: 'EChartBrick',
        category: '无线',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/ac/memory_top',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-fill',
        name: 'AC用户排行',
        type: 'EChartBrick',
        category: '无线',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/ac/user_count_top',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    }
]

export { wirelessComponents }
