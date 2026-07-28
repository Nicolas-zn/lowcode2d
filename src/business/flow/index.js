/**
 * 流量统计业务组件库配置
 * 基于 api_list.md 中的流量统计接口
 */

// 从环境变量获取 API URL
const CHART_API_URL = import.meta.env.VITE_CHART_API_URL
const API_TOKEN = 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'

const flowComponents = [
    // 柱状图
    {
        icon: 'bi-bar-chart-fill',
        name: '总流量排行',
        type: 'EChartBrick',
        category: '流量',
        defaultWidth: 500,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/flow/total_ranking',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 折线图
    {
        icon: 'bi-graph-up',
        name: '接口流量趋势',
        type: 'LineChartBrick',
        category: '流量',
        defaultWidth: 500,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/flow/trend',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    // 柱状图
    {
        icon: 'bi-bar-chart-fill',
        name: '上行流量排行',
        type: 'EChartBrick',
        category: '流量',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/flow/up_speed_ranking',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-fill',
        name: '下行流量排行',
        type: 'EChartBrick',
        category: '流量',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/flow/down_speed_ranking',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-graph-up',
        name: '接口流量趋势(详情)',
        type: 'LineChartBrick',
        category: '流量',
        defaultWidth: 500,
        defaultHeight: 300,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/flow/get_interface_flow',
            method: 'GET',
            token: API_TOKEN
        },
        isBusinessComponent: true
    }
]

export { flowComponents }
