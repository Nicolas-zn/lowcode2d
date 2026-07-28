/**
 * 告警业务组件库配置
 * 基于 api_list.md 中的告警接口
 */

// 从环境变量获取 API URL
const CHART_API_URL = import.meta.env.VITE_CHART_API_URL
const API_TOKEN = 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'

const alarmComponents = [
    // 表格
    {
        icon: 'bi-table',
        name: '今日告警未处理',
        type: 'TableBrick',
        category: '告警',
        defaultWidth: 600,
        defaultHeight: 400,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/list',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 仪表盘
    {
        icon: 'bi-speedometer2',
        name: '总告警未处理率',
        type: 'GaugeBrick',
        category: '告警',
        defaultWidth: 300,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/unhandled_rate',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-speedometer2',
        name: '今日告警未处理率',
        type: 'GaugeBrick',
        category: '告警',
        defaultWidth: 300,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/overview',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 饼图
    {
        icon: 'bi-pie-chart-fill',
        name: '告警状态分布',
        type: 'PieChartBrick',
        category: '告警',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/status_distribution',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: '告警级别分布',
        type: 'PieChartBrick',
        category: '告警',
        defaultWidth: 400,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/level_distribution',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 折线图
    {
        icon: 'bi-graph-up',
        name: '日告警趋势',
        type: 'LineChartBrick',
        category: '告警',
        defaultWidth: 500,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/trend_by_day',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 柱状图
    {
        icon: 'bi-bar-chart-fill',
        name: '未处理告警排行',
        type: 'EChartBrick',
        category: '告警',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/top_devices',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-steps',
        name: '告警规则TOP',
        type: 'HorizontalBarBrick',
        category: '告警',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/mttr_trend_by_day',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-fill',
        name: '告警未处理时间排行',
        type: 'EChartBrick',
        category: '告警',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/unhandled_duration_ranking',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-fill',
        name: '告警未处理次数排行',
        type: 'EChartBrick',
        category: '告警',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/unhandled_trigger_times_rank',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    }
]

export { alarmComponents }
