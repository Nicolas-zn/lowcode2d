/**
 * 资产业务组件库配置
 * @type {import('../../types/component').BusinessComponentConfig[]}
 */

// 从环境变量获取 API URL
const CHART_API_URL = import.meta.env.VITE_CHART_API_URL

const assetsBusinessComponents = [
    {
        type: 'EChartBrick',
        name: '资产统计图表',
        icon: 'bi-bar-chart-fill',
        category: '资产',
        title: '资产数据统计',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: 'http://localhost:3001',
            suffix: '/api/echart',
            method: 'GET',
            token: ''
        },
        isBusinessComponent: true
    },
    {
        type: 'EChartBrick',
        name: '资产统计图表2',
        icon: 'bi-bar-chart-fill',
        category: '资产',
        title: '资产数据统计2',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/type',
            method: 'GET',
            token: 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'
        },
        isBusinessComponent: true
    },
    {
        type: 'PieChartBrick',
        name: '资产统计图表',
        icon: 'bi-bar-chart-fill',
        category: '资产',
        title: '资产数据统计',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: 'http://localhost:3001',
            suffix: '/api/echart',
            method: 'GET',
            token: ''
        },
        isBusinessComponent: true
    },
    {
        "id": 1768052225011.1882,
        icon: 'bi-bar-chart-fill',
        "name": "饼图",
        "type": "PieChartBrick",
        category: '示例',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/type',
            method: 'GET',
            token: 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'
        },
        "isBusinessComponent": false,
        "echartTheme": "",
        "colorPalette": ""
    },
    {
        "id": 6597414.1882,
        icon: 'bi-bar-chart-fill',
        "name": "柱状图",
        "type": "EChartBrick",
        category: '示例',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/day_new',
            method: 'GET',
            token: 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'
        },
        "isBusinessComponent": false,
        "echartTheme": "",
        "colorPalette": ""
    },
    {
        "id": 6597414.1882,
        icon: 'bi-bar-chart-fill',
        "name": "折线图",
        "type": "LineChartBrick",
        category: '示例',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/trend_by_day',
            method: 'GET',
            token: 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'
        },
        "isBusinessComponent": false,
        "echartTheme": "",
        "colorPalette": ""
    },
    {
        "id": 14545.1882,
        icon: 'bi-bar-chart-fill',
        "name": "水平柱状图",
        "type": "HorizontalBarBrick",
        category: '示例',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/device/delay_top',
            method: 'GET',
            token: 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'
        },
        "isBusinessComponent": false,
        "echartTheme": "",
        "colorPalette": ""
    },


    {
        "id": 14545.1882,
        icon: 'bi-bar-chart-fill',
        "name": "仪表盘",
        "type": "GaugeBrick",
        category: '示例',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/asset/current_online',
            method: 'GET',
            token: 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'
        },
        "isBusinessComponent": false,
        "echartTheme": "",
        "colorPalette": ""
    },
    {
        "id": 14545215.1882,
        icon: 'bi-bar-chart-fill',
        "name": "表格组件",
        "type": "TableBrick",
        category: '示例',
        defaultWidth: 450,
        defaultHeight: 320,
        api: {
            url: CHART_API_URL,
            suffix: '/admin/api/v2/alarm/list',
            method: 'GET',
            token: 'jJw6OBCHA0iVH7qyX5sytlOom8dt8WSL'
        },
        "isBusinessComponent": false,
        "echartTheme": "",
        "colorPalette": ""
    }
]

export { assetsBusinessComponents }