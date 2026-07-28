/**
 * 业务组件模板示例
 * 
 * 复制此文件并修改为你的业务组件配置
 * 
 * 注意：业务组件不需要 defaultProps，数据通过 API 获取
 * 
 * @type {import('../types/component').BusinessComponentConfig[]}
 */
const exampleBusinessComponents = [
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

export { exampleBusinessComponents }
