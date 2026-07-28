const chartTypeComponents = [
    {
        icon: 'bi-bar-chart-fill',
        name: '柱状图',
        type: 'EChartBrick',
        category: '柱状图',
        defaultWidth: 450,
        defaultHeight: 320,
        defaultProps: {
            title: '柱状图',
            chartType: 'bar',
            data: {
                xAxis: ['一月', '二月', '三月', '四月', '五月'],
                series: [
                    { name: '访问量', data: [120, 200, 150, 80, 170] }
                ]
            },
            chartOption: [
                { name: '访问量', field: '访问量', color: '#5470c6' }
            ]
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-bar-chart-steps',
        name: '横向柱状图',
        type: 'HorizontalBarBrick',
        category: '柱状图',
        defaultWidth: 450,
        defaultHeight: 320,
        defaultProps: {
            title: '横向柱状图'
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-pie-chart-fill',
        name: '饼图',
        type: 'PieChartBrick',
        category: '饼图',
        defaultWidth: 400,
        defaultHeight: 300,
        defaultProps: {
            title: '饼图'
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-graph-up',
        name: '折线图',
        type: 'LineChartBrick',
        category: '折线图',
        defaultWidth: 500,
        defaultHeight: 300,
        defaultProps: {
            title: '折线图'
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-table',
        name: '表格',
        type: 'TableBrick',
        category: '表格',
        defaultWidth: 600,
        defaultHeight: 400,
        defaultProps: {
            title: '表格',
            columns: ['名称', '数量', '状态'],
            rows: [
                { '名称': '项目A', '数量': 120, '状态': '正常' },
                { '名称': '项目B', '数量': 86, '状态': '正常' },
                { '名称': '项目C', '数量': 42, '状态': '告警' }
            ],
            pageSize: 5,
            showPagination: true
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-123',
        name: '统计卡片',
        type: 'StatCardBrick',
        category: '指标',
        defaultWidth: 280,
        defaultHeight: 150,
        defaultProps: {
            title: '统计卡片',
            value: 14852,
            trend: '12.3% vs. last week',
            trendType: 'up'
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-speedometer2',
        name: '仪表盘',
        type: 'GaugeBrick',
        category: '指标',
        defaultWidth: 300,
        defaultHeight: 300,
        defaultProps: {
            title: '仪表盘',
            value: 75,
            min: 0,
            max: 100,
            unit: '%'
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-droplet-fill',
        name: '水滴图',
        type: 'WaterDropBrick',
        category: '指标',
        defaultWidth: 360,
        defaultHeight: 300,
        defaultProps: {
            title: '水滴图',
            value: 0.65
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-diagram-3-fill',
        name: '雷达图',
        type: 'RadarBrick',
        category: '雷达图',
        defaultWidth: 450,
        defaultHeight: 320,
        defaultProps: {
            title: '雷达图'
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-funnel-fill',
        name: '漏斗图',
        type: 'FunnelBrick',
        category: '漏斗图',
        defaultWidth: 450,
        defaultHeight: 320,
        defaultProps: {
            title: '漏斗图'
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-flower1',
        name: '玫瑰图',
        type: 'RingBarBrick',
        category: '饼图',
        defaultWidth: 450,
        defaultHeight: 320,
        defaultProps: {
            title: '玫瑰图'
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-camera-video',
        name: 'm3u8视频',
        type: 'HLSVideoBrick',
        category: '视频',
        defaultWidth: 640,
        defaultHeight: 360,
        defaultProps: {
            title: 'm3u8视频',
            src: '',
            controls: true,
            autoplay: true,
            muted: true,
            loop: false,
            objectFit: 'contain'
        },
        isBusinessComponent: true
    },
    {
        icon: 'bi-camera-reels',
        name: 'flv视频',
        type: 'FLVVideoBrick',
        category: '视频',
        defaultWidth: 640,
        defaultHeight: 360,
        defaultProps: {
            title: 'flv视频',
            src: '',
            controls: true,
            autoplay: true,
            muted: true,
            loop: false,
            objectFit: 'contain'
        },
        isBusinessComponent: true
    }
]

const chartComponentsByCategory = chartTypeComponents.reduce((groups, component) => {
    const category = component.category || '未分类'
    if (!groups[category]) {
        groups[category] = []
    }
    groups[category].push(component)
    return groups
}, {})

export {
    chartTypeComponents,
    chartComponentsByCategory
}
