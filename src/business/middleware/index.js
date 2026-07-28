/**
 * 中间件业务组件库配置
 * 基于 api_list.md 中的中间件接口
 */

// 从环境变量获取 API URL
const CHART_API_URL = import.meta.env.VITE_CHART_API_URL
const API_TOKEN = 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'

const middlewareComponents = [
    // 饼图
    {
        icon: 'bi-pie-chart-fill',
        name: '监控点数量分布',
        type: 'PieChartBrick',
        category: '中间件',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/hzb/monitor_distribution',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 柱状图
    {
        icon: 'bi-bar-chart-fill',
        name: '主机数量分布',
        type: 'EChartBrick',
        category: '中间件',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/hzb/host_middleware',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-steps',
        name: '监控应用排行',
        type: 'HorizontalBarBrick',
        category: '中间件',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/hzb/app_ranking',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 折线图
    {
        icon: 'bi-graph-up',
        name: '监控点新增趋势',
        type: 'LineChartBrick',
        category: '中间件',
        defaultWidth: 500,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/hzb/daily_trend',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-fill',
        name: '分组状态统计',
        type: 'EChartBrick',
        category: '中间件',
        defaultWidth: 500,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/hzb/category_stats',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    }
]

export { middlewareComponents }
