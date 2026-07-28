import EChartBrick from './EChartBrick.vue'
import HeaderBrick from './HeaderBrick.vue'
import TitleBrick from './TitleBrick.vue'
import PieChartBrick from './PieChartBrick.vue'
import LineChartBrick from './LineChartBrick.vue'
import TableBrick from './TableBrick.vue'
import StatCardBrick from './StatCardBrick.vue'
import WaterDropBrick from './WaterDropBrick.vue'
import GaugeBrick from './GaugeBrick.vue'
import FunnelBrick from './FunnelBrick.vue'
import HorizontalBarBrick from './HorizontalBarBrick.vue'
import RadarBrick from './RadarBrick.vue'
import RingBarBrick from './RingBarBrick.vue'
import PlaceholderBrick from './PlaceholderBrick.vue'
import ImgBrick from './ImgBrick.vue'
import CesiumBrick from './CesiumBrick.vue'
import ThreeJSBrick from './ThreeJSBrick.vue'
import MenuBrick from './MenuBrick.vue'
import HeaderMenuBrick from './HeaderMenuBrick.vue'
import ButtonBrick from './ButtonBrick.vue'
import HLSVideoBrick from './HLSVideoBrick.vue'
import FLVVideoBrick from './FLVVideoBrick.vue'
import EChartMapBrick from './EChartMapBrick.vue'

// 可用的组件列表
export const brickComponents = {
    EChartBrick,
    // HeaderBrick,
    // TitleBrick,
    PieChartBrick,
    LineChartBrick,
    TableBrick,
    StatCardBrick,
    WaterDropBrick,
    GaugeBrick,
    FunnelBrick,
    HorizontalBarBrick,
    RadarBrick,
    RingBarBrick,
    PlaceholderBrick,
    ImgBrick,
    CesiumBrick,
    ThreeJSBrick,
    MenuBrick,
    HeaderMenuBrick,
    ButtonBrick,
    HLSVideoBrick,
    FLVVideoBrick,
    EChartMapBrick
}

// 组件库配置
export const brickLibrary = [
    // {
    //     type: 'EChartBrick',
    //     name: '柱状图',
    //     icon: 'bi-bar-chart-fill',
    //     defaultProps: {
    //         title: '每周销售数据',
    //         chartType: 'bar',
    //         data: {
    //             xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    //             series: [
    //                 {
    //                     name: '销售额',
    //                     data: [120, 200, 150, 80, 70, 110, 130]
    //                 }
    //             ]
    //         },
    //         chartOption: [
    //             { name: '销售额', field: '销售额', color: '#667eea' }
    //         ]
    //     },
    //     defaultWidth: 450,
    //     defaultHeight: 320
    // },
    // {
    //     type: 'PieChartBrick',
    //     name: '饼图',
    //     icon: 'bi-pie-chart-fill',
    //     defaultProps: {
    //         title: '产品销售占比',
    //         data: [
    //             { value: 335, name: '产品A' },
    //             { value: 310, name: '产品B' },
    //             { value: 234, name: '产品C' },
    //             { value: 135, name: '产品D' },
    //             { value: 148, name: '产品E' }
    //         ],
    //         chartOption: [
    //             { name: '产品A', field: '产品A', color: '#5470c6' },
    //             { name: '产品B', field: '产品B', color: '#91cc75' },
    //             { name: '产品C', field: '产品C', color: '#fac858' },
    //             { name: '产品D', field: '产品D', color: '#ee6666' },
    //             { name: '产品E', field: '产品E', color: '#73c0de' }
    //         ]
    //     },
    //     defaultWidth: 450,
    //     defaultHeight: 320
    // },
    // {
    //     type: 'LineChartBrick',
    //     name: '折线图',
    //     icon: 'bi-graph-down',
    //     defaultProps: {
    //         title: '每周数据趋势',
    //         chartType: 'line',
    //         data: {
    //             xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    //             series: [
    //                 {
    //                     name: '销售额',
    //                     data: [820, 932, 901, 934, 1290, 1330, 1320]
    //                 },
    //                 {
    //                     name: '访问量',
    //                     data: [620, 732, 701, 734, 1090, 1130, 1120]
    //                 }
    //             ]
    //         },
    //         chartOption: [
    //             { name: '销售额', field: '销售额', color: '#5470c6' },
    //             { name: '访问量', field: '访问量', color: '#91cc75' }
    //         ]
    //     },
    //     defaultWidth: 450,
    //     defaultHeight: 320
    // },
    // {
    //     type: 'TableBrick',
    //     name: '表格',
    //     icon: 'bi-table',
    //     defaultProps: {
    //         title: '员工信息表',
    //         columns: ['姓名', '年龄', '职位', '部门'],
    //         rows: [
    //             { '姓名': '张三', '年龄': 28, '职位': '工程师', '部门': '技术部' },
    //             { '姓名': '李四', '年龄': 32, '职位': '产品经理', '部门': '产品部' },
    //             { '姓名': '王五', '年龄': 25, '职位': '设计师', '部门': '设计部' },
    //             { '姓名': '赵六', '年龄': 30, '职位': '运营', '部门': '运营部' },
    //             { '姓名': '孙七', '年龄': 27, '职位': '测试', '部门': '技术部' },
    //             { '姓名': '周八', '年龄': 29, '职位': '前端', '部门': '技术部' },
    //             { '姓名': '吴九', '年龄': 31, '职位': '后端', '部门': '技术部' },
    //             { '姓名': '郑十', '年龄': 26, '职位': '数据分析', '部门': '产品部' }
    //         ],
    //         pageSize: 5,
    //         showPagination: true
    //     },
    //     defaultWidth: 600,
    //     defaultHeight: 350
    // },
    // {
    //     type: 'StatCardBrick',
    //     name: '统计卡片',
    //     icon: 'bi-123',
    //     defaultProps: {
    //         title: 'Transactions Analysed',
    //         value: 14852,
    //         trend: '12.3% vs. last week',
    //         trendType: 'down',
    //         backgroundColor: '#ffffff',
    //         titleColor: '#999999',
    //         valueColor: '#000000',
    //         upColor: '#52c41a',
    //         downColor: '#ff4d4f',
    //         neutralColor: '#666666'
    //     },
    //     defaultWidth: 280,
    //     defaultHeight: 150
    // },
    // {
    //     type: 'WaterDropBrick',
    //     name: '水滴图',
    //     icon: 'bi-droplet-fill',
    //     defaultProps: {
    //         title: '完成率',
    //         value: 0.65,
    //         color: ['#294D99', '#156ACF', '#1598ED', '#45BDFF'],
    //         shape: 'circle',
    //         backgroundColor: '#f0f0f0',
    //         label: {
    //             show: true,
    //             fontSize: 50,
    //             color: '#FFFFFF'
    //         }
    //     },
    //     defaultWidth: 450,
    //     defaultHeight: 320
    // },
    // {
    //     type: 'GaugeBrick',
    //     name: '仪表盘',
    //     icon: 'bi-speedometer2',
    //     defaultProps: {
    //         title: '速度仪表盘',
    //         value: 75,
    //         min: 0,
    //         max: 100,
    //         unit: 'km/h'
    //     },
    //     defaultWidth: 450,
    //     defaultHeight: 320
    // },
    // {
    //     type: 'FunnelBrick',
    //     name: '漏斗图',
    //     icon: 'bi-funnel-fill',
    //     defaultProps: {
    //         title: '转化漏斗',
    //         data: [
    //             { value: 100, name: '访问' },
    //             { value: 80, name: '咨询' },
    //             { value: 60, name: '订单' },
    //             { value: 40, name: '点击' },
    //             { value: 20, name: '成交' }
    //         ],
    //         chartOption: [
    //             { name: '访问', field: '访问', color: '#5470c6' },
    //             { name: '咨询', field: '咨询', color: '#91cc75' },
    //             { name: '订单', field: '订单', color: '#fac858' },
    //             { name: '点击', field: '点击', color: '#ee6666' },
    //             { name: '成交', field: '成交', color: '#73c0de' }
    //         ]
    //     },
    //     defaultWidth: 450,
    //     defaultHeight: 320
    // },
    // {
    //     type: 'HorizontalBarBrick',
    //     name: '水平柱状图',
    //     icon: 'bi-bar-chart',
    //     defaultProps: {
    //         title: '产品销量排行',
    //         chartType: 'bar',
    //         data: {
    //             yAxis: ['产品A', '产品B', '产品C', '产品D', '产品E'],
    //             series: [
    //                 {
    //                     name: '销量',
    //                     data: [320, 302, 301, 334, 390]
    //                 }
    //             ]
    //         },
    //         chartOption: [
    //             { name: '销量', field: '销量', color: '#5470c6' }
    //         ]
    //     },
    //     defaultWidth: 450,
    //     defaultHeight: 320
    // },
    // {
    //     type: 'RadarBrick',
    //     name: '雷达图',
    //     icon: 'bi-diagram-3-fill',
    //     defaultProps: {
    //         title: '能力雷达图',
    //         chartType: 'radar',
    //         data: {
    //             indicator: [
    //                 { name: '销售', max: 100 },
    //                 { name: '管理', max: 100 },
    //                 { name: '技术', max: 100 },
    //                 { name: '客服', max: 100 },
    //                 { name: '研发', max: 100 },
    //                 { name: '市场', max: 100 }
    //             ],
    //             series: [
    //                 {
    //                     name: '预算分配',
    //                     data: [80, 90, 85, 70, 95, 88]
    //                 },
    //                 {
    //                     name: '实际开销',
    //                     data: [70, 82, 90, 75, 88, 80]
    //                 }
    //             ]
    //         },
    //         chartOption: [
    //             { name: '预算分配', field: '预算分配', color: '#5470c6' },
    //             { name: '实际开销', field: '实际开销', color: '#91cc75' }
    //         ]
    //     },
    //     defaultWidth: 450,
    //     defaultHeight: 320
    // },
    // {
    //     type: 'RingBarBrick',
    //     name: '环形柱状图',
    //     icon: 'bi-flower1',
    //     defaultProps: {
    //         title: '南丁格尔玫瑰图',
    //         data: [
    //             { value: 40, name: '类别1' },
    //             { value: 38, name: '类别2' },
    //             { value: 32, name: '类别3' },
    //             { value: 30, name: '类别4' },
    //             { value: 28, name: '类别5' },
    //             { value: 26, name: '类别6' },
    //             { value: 22, name: '类别7' },
    //             { value: 18, name: '类别8' }
    //         ],
    //         roseType: 'radius',
    //         chartOption: [
    //             { name: '类别1', field: '类别1', color: '#161616ff' },
    //             { name: '类别2', field: '类别2', color: '#91cc75' },
    //             { name: '类别3', field: '类别3', color: '#fac858' },
    //             { name: '类别4', field: '类别4', color: '#ee6666' },
    //             { name: '类别5', field: '类别5', color: '#73c0de' },
    //             { name: '类别6', field: '类别6', color: '#3ba272' },
    //             { name: '类别7', field: '类别7', color: '#fc8452' },
    //             { name: '类别8', field: '类别8', color: '#9a60b4' }
    //         ]
    //     },
    //     defaultWidth: 450,
    //     defaultHeight: 320
    // },
    // {
    //     type: 'ImgBrick',
    //     name: '图片',
    //     icon: 'bi-image',
    //     defaultProps: {
    //         src: '',
    //         alt: '图片',
    //         objectFit: 'contain',
    //         objectPosition: 'center',
    //         borderRadius: 0,
    //         backgroundColor: 'transparent',
    //         shadow: false
    //     },
    //     defaultWidth: 400,
    //     defaultHeight: 300
    // },
    {
        type: 'MenuBrick',
        name: '导航菜单',
        icon: 'bi-list',
        defaultProps: {
            menuItems: [{ name: '首页', pageIndex: 0 }],
            direction: 'horizontal',
            activeColor: '#409eff',
            bgColor: 'rgba(0, 10, 30, 0.85)',
            textColor: 'rgba(255, 255, 255, 0.75)'
        },
        defaultWidth: 1880,
        defaultHeight: 50
    },
    {
        type: 'HeaderMenuBrick',
        name: '顶栏菜单',
        icon: 'bi-aspect-ratio',
        defaultProps: {
            title: '大屏可视化项目',
            titleColor: '#ffffff',
            titleSize: 32,
            menuItems: [
                { name: '首页', pageIndex: 0 },
                { name: '数据监控', pageIndex: 1 }
            ],
            activeColor: '#4ab2e4',
            textColor: 'rgba(255, 255, 255, 0.75)'
        },
        defaultWidth: 1920,
        defaultHeight: 80
    },
    {
        type: 'ButtonBrick',
        name: '交互操作按钮',
        icon: 'bi-hand-index-thumb',
        defaultProps: {
            text: '触发动作',
            buttonType: 'primary',
            size: 'default',
            plain: false,
            round: false,
            circle: false,
            customColor: ''
        },
        defaultWidth: 120,
        defaultHeight: 40
    }
]

