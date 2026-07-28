/**
 * 资产业务组件库配置
 * 基于 api_list.md 中的资产接口
 */

// 从环境变量获取 API URL
const CHART_API_URL = import.meta.env.VITE_CHART_API_URL
const API_TOKEN = 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'

const assetComponents = [
    // 饼图类组件
    {
        icon: 'bi-pie-chart-fill',
        name: '资产类型分布',
        type: 'PieChartBrick',
        category: '资产',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/type',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: '资产型号分布',
        type: 'PieChartBrick',
        category: '资产',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/model',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: '资产区域分布',
        type: 'PieChartBrick',
        category: '资产',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/area',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: '资产状态分布',
        type: 'PieChartBrick',
        category: '资产',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/state',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: '资产连通性',
        type: 'PieChartBrick',
        category: '资产',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/status',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: '资产厂家分布',
        type: 'PieChartBrick',
        category: '资产',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/mfg',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: '资产维保状态',
        type: 'PieChartBrick',
        category: '资产',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/maintenance',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 柱状图
    {
        icon: 'bi-bar-chart-fill',
        name: '资产每日新增',
        type: 'EChartBrick',
        category: '资产',
        defaultWidth: 500,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/day_new',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 折线图
    {
        icon: 'bi-graph-up',
        name: '资产在线趋势',
        type: 'LineChartBrick',
        category: '资产',
        defaultWidth: 500,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/online_rate',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 仪表盘
    {
        icon: 'bi-speedometer2',
        name: '当前资产在线率',
        type: 'GaugeBrick',
        category: '资产',
        defaultWidth: 300,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/current_online',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 表格
    {
        icon: 'bi-table',
        name: '设备信息列表',
        type: 'TableBrick',
        category: '资产',
        defaultWidth: 600,
        defaultHeight: 400,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/info',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    }
]

export { assetComponents }
