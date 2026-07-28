// 大屏布局模板
// 提供常见的可视化大屏布局预设
// 统一边距：外边距 20px，组件间距 20px

const MARGIN = 20  // 外边距
const GAP = 20     // 组件间距

const basicTemplates = [
    {
        id: 'dashboard-modern',
        name: '现代仪表盘',
        description: '顶部标题 + 统计卡片 + 数据可视化',
        thumbnail: '📊',
        layout: [
            // 顶部标题
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '页面标题' },
            // 统计卡片行
            { x: 20, y: 120, width: 450, height: 160, type: 'placeholder', title: '统计卡片 1' },
            { x: 490, y: 120, width: 450, height: 160, type: 'placeholder', title: '统计卡片 2' },
            { x: 960, y: 120, width: 450, height: 160, type: 'placeholder', title: '统计卡片 3' },
            { x: 1430, y: 120, width: 470, height: 160, type: 'placeholder', title: '统计卡片 4' },
            // 主要图表区
            { x: 20, y: 300, width: 940, height: 420, type: 'placeholder', title: '主要图表' },
            { x: 980, y: 300, width: 920, height: 420, type: 'placeholder', title: '辅助图表' },
            // 底部数据区
            { x: 20, y: 740, width: 1880, height: 320, type: 'placeholder', title: '数据表格' }
        ]
    },
    {
        id: 'monitor-center',
        name: '监控中心',
        description: '左侧统计 + 中间主区 + 右侧信息',
        thumbnail: '🖥️',
        layout: [
            // 左侧栏
            { x: 20, y: 20, width: 360, height: 340, type: 'placeholder', title: '实时统计' },
            { x: 20, y: 380, width: 360, height: 340, type: 'placeholder', title: '设备状态' },
            { x: 20, y: 740, width: 360, height: 320, type: 'placeholder', title: '告警信息' },
            // 中间主区
            { x: 400, y: 20, width: 1080, height: 520, type: 'placeholder', title: '监控大屏' },
            { x: 400, y: 560, width: 1080, height: 500, type: 'placeholder', title: '数据列表' },
            // 右侧栏
            { x: 1500, y: 20, width: 400, height: 520, type: 'placeholder', title: '趋势分析' },
            { x: 1500, y: 560, width: 400, height: 500, type: 'placeholder', title: '操作日志' }
        ]
    },
    {
        id: 'data-grid',
        name: '数据网格',
        description: '2x2 均衡四宫格布局',
        thumbnail: '⊞',
        layout: [
            { x: 20, y: 20, width: 930, height: 520, type: 'placeholder', title: '图表 1' },
            { x: 970, y: 20, width: 930, height: 520, type: 'placeholder', title: '图表 2' },
            { x: 20, y: 560, width: 930, height: 500, type: 'placeholder', title: '图表 3' },
            { x: 970, y: 560, width: 930, height: 500, type: 'placeholder', title: '图表 4' }
        ]
    },
    {
        id: 'focus-center',
        name: '中心聚焦',
        description: '中央核心区 + 四周辅助区',
        thumbnail: '🎯',
        layout: [
            // 左侧小卡片
            { x: 20, y: 20, width: 360, height: 250, type: 'placeholder', title: '左上指标' },
            { x: 20, y: 290, width: 360, height: 250, type: 'placeholder', title: '左中指标' },
            { x: 20, y: 560, width: 360, height: 250, type: 'placeholder', title: '左下指标' },
            { x: 20, y: 830, width: 360, height: 230, type: 'placeholder', title: '左底指标' },
            // 中央主区域
            { x: 400, y: 20, width: 1100, height: 700, type: 'placeholder', title: '核心数据大屏' },
            { x: 400, y: 740, width: 1100, height: 320, type: 'placeholder', title: '详细数据表' },
            // 右侧小卡片
            { x: 1520, y: 20, width: 380, height: 250, type: 'placeholder', title: '右上指标' },
            { x: 1520, y: 290, width: 380, height: 250, type: 'placeholder', title: '右中指标' },
            { x: 1520, y: 560, width: 380, height: 250, type: 'placeholder', title: '右下指标' },
            { x: 1520, y: 830, width: 380, height: 230, type: 'placeholder', title: '右底指标' }
        ]
    },
    {
        id: 'top-bottom',
        name: '上下分区',
        description: '顶部概览卡片 + 底部详情',
        thumbnail: '⬒',
        layout: [
            // 标题栏
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '标题栏' },
            // 顶部指标卡片
            { x: 20, y: 120, width: 610, height: 360, type: 'placeholder', title: '核心指标 1' },
            { x: 650, y: 120, width: 610, height: 360, type: 'placeholder', title: '核心指标 2' },
            { x: 1280, y: 120, width: 620, height: 360, type: 'placeholder', title: '核心指标 3' },
            // 底部详细数据区
            { x: 20, y: 500, width: 1880, height: 560, type: 'placeholder', title: '详细数据展示区' }
        ]
    },
    {
        id: 'triple-column',
        name: '三栏布局',
        description: '左中右三栏等分布局',
        thumbnail: '|||',
        layout: [
            { x: 20, y: 20, width: 610, height: 1040, type: 'placeholder', title: '左栏区域' },
            { x: 650, y: 20, width: 610, height: 1040, type: 'placeholder', title: '中栏区域' },
            { x: 1280, y: 20, width: 620, height: 1040, type: 'placeholder', title: '右栏区域' }
        ]
    },
    {
        id: 'asymmetric-modern',
        name: '不对称现代',
        description: '左宽右窄，层次分明',
        thumbnail: '🎨',
        layout: [
            // 左侧大区域
            { x: 20, y: 20, width: 1200, height: 520, type: 'placeholder', title: '主要数据展示' },
            { x: 20, y: 560, width: 1200, height: 500, type: 'placeholder', title: '趋势分析图表' },
            // 右侧小卡片组
            { x: 1240, y: 20, width: 660, height: 250, type: 'placeholder', title: '实时监控' },
            { x: 1240, y: 290, width: 660, height: 250, type: 'placeholder', title: '状态统计' },
            { x: 1240, y: 560, width: 660, height: 250, type: 'placeholder', title: '告警信息' },
            { x: 1240, y: 830, width: 660, height: 230, type: 'placeholder', title: '操作记录' }
        ]
    },
    {
        id: 'golden-ratio',
        name: '黄金分割',
        description: '基于黄金比例的美学布局',
        thumbnail: '✨',
        layout: [
            // 顶部标题
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '页面标题' },
            // 左侧主区（约 61.8%）
            { x: 20, y: 120, width: 1160, height: 460, type: 'placeholder', title: '主要图表区' },
            { x: 20, y: 600, width: 1160, height: 460, type: 'placeholder', title: '数据详情区' },
            // 右侧辅助区（约 38.2%）
            { x: 1200, y: 120, width: 700, height: 300, type: 'placeholder', title: '关键指标 1' },
            { x: 1200, y: 440, width: 700, height: 300, type: 'placeholder', title: '关键指标 2' },
            { x: 1200, y: 760, width: 700, height: 300, type: 'placeholder', title: '关键指标 3' }
        ]
    },
    {
        id: 'masonry-style',
        name: '瀑布流式',
        description: '错落有致的卡片布局',
        thumbnail: '🧱',
        layout: [
            // 第一列
            { x: 20, y: 20, width: 450, height: 300, type: 'placeholder', title: '卡片 1' },
            { x: 20, y: 340, width: 450, height: 380, type: 'placeholder', title: '卡片 2' },
            { x: 20, y: 740, width: 450, height: 320, type: 'placeholder', title: '卡片 3' },
            // 第二列
            { x: 490, y: 20, width: 450, height: 380, type: 'placeholder', title: '卡片 4' },
            { x: 490, y: 420, width: 450, height: 300, type: 'placeholder', title: '卡片 5' },
            { x: 490, y: 740, width: 450, height: 320, type: 'placeholder', title: '卡片 6' },
            // 第三列
            { x: 960, y: 20, width: 450, height: 320, type: 'placeholder', title: '卡片 7' },
            { x: 960, y: 360, width: 450, height: 360, type: 'placeholder', title: '卡片 8' },
            { x: 960, y: 740, width: 450, height: 320, type: 'placeholder', title: '卡片 9' },
            // 第四列
            { x: 1430, y: 20, width: 470, height: 360, type: 'placeholder', title: '卡片 10' },
            { x: 1430, y: 400, width: 470, height: 320, type: 'placeholder', title: '卡片 11' },
            { x: 1430, y: 740, width: 470, height: 320, type: 'placeholder', title: '卡片 12' }
        ]
    }
]

const topMenuTemplates = [
    {
        id: 'dashboard-modern-topmenu',
        name: '现代仪表盘 (含顶栏)',
        description: '顶部标题 + 统计卡片 + 数据可视化',
        thumbnail: '📊',
        layout: [
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '顶部导航菜单' },
            { x: 20, y: 120, width: 450, height: 160, type: 'placeholder', title: '统计卡片 1' },
            { x: 490, y: 120, width: 450, height: 160, type: 'placeholder', title: '统计卡片 2' },
            { x: 960, y: 120, width: 450, height: 160, type: 'placeholder', title: '统计卡片 3' },
            { x: 1430, y: 120, width: 470, height: 160, type: 'placeholder', title: '统计卡片 4' },
            { x: 20, y: 300, width: 940, height: 420, type: 'placeholder', title: '主要图表' },
            { x: 980, y: 300, width: 920, height: 420, type: 'placeholder', title: '辅助图表' },
            { x: 20, y: 740, width: 1880, height: 320, type: 'placeholder', title: '数据表格' }
        ]
    },
    {
        id: 'monitor-center-topmenu',
        name: '监控中心 (含顶栏)',
        description: '左侧统计 + 中间主区 + 右侧信息',
        thumbnail: '🖥️',
        layout: [
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '顶部导航菜单' },
            // 左侧栏
            { x: 20, y: 120, width: 360, height: 300, type: 'placeholder', title: '实时统计' },
            { x: 20, y: 440, width: 360, height: 300, type: 'placeholder', title: '设备状态' },
            { x: 20, y: 760, width: 360, height: 300, type: 'placeholder', title: '告警信息' },
            // 中间主区
            { x: 400, y: 120, width: 1080, height: 460, type: 'placeholder', title: '监控大屏' },
            { x: 400, y: 600, width: 1080, height: 460, type: 'placeholder', title: '数据列表' },
            // 右侧栏
            { x: 1500, y: 120, width: 400, height: 460, type: 'placeholder', title: '趋势分析' },
            { x: 1500, y: 600, width: 400, height: 460, type: 'placeholder', title: '操作日志' }
        ]
    },
    {
        id: 'data-grid-topmenu',
        name: '数据网格 (含顶栏)',
        description: '2x2 均衡四宫格布局',
        thumbnail: '⊞',
        layout: [
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '顶部导航菜单' },
            { x: 20, y: 120, width: 930, height: 460, type: 'placeholder', title: '图表 1' },
            { x: 970, y: 120, width: 930, height: 460, type: 'placeholder', title: '图表 2' },
            { x: 20, y: 600, width: 930, height: 460, type: 'placeholder', title: '图表 3' },
            { x: 970, y: 600, width: 930, height: 460, type: 'placeholder', title: '图表 4' }
        ]
    },
    {
        id: 'focus-center-topmenu',
        name: '中心聚焦 (含顶栏)',
        description: '中央核心区 + 四周辅助区',
        thumbnail: '🎯',
        layout: [
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '顶部导航菜单' },
            // 左侧小卡片
            { x: 20, y: 120, width: 360, height: 220, type: 'placeholder', title: '左上指标' },
            { x: 20, y: 360, width: 360, height: 220, type: 'placeholder', title: '左中指标' },
            { x: 20, y: 600, width: 360, height: 220, type: 'placeholder', title: '左下指标' },
            { x: 20, y: 840, width: 360, height: 220, type: 'placeholder', title: '左底指标' },
            // 中央主区域
            { x: 400, y: 120, width: 1100, height: 620, type: 'placeholder', title: '核心数据大屏' },
            { x: 400, y: 760, width: 1100, height: 300, type: 'placeholder', title: '详细数据表' },
            // 右侧小卡片
            { x: 1520, y: 120, width: 380, height: 220, type: 'placeholder', title: '右上指标' },
            { x: 1520, y: 360, width: 380, height: 220, type: 'placeholder', title: '右中指标' },
            { x: 1520, y: 600, width: 380, height: 220, type: 'placeholder', title: '右下指标' },
            { x: 1520, y: 840, width: 380, height: 220, type: 'placeholder', title: '右底指标' }
        ]
    },
    {
        id: 'top-bottom-topmenu',
        name: '上下分区 (含顶栏)',
        description: '顶部概览卡片 + 底部详情',
        thumbnail: '⬒',
        layout: [
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '顶部导航菜单' },
            { x: 20, y: 120, width: 610, height: 360, type: 'placeholder', title: '核心指标 1' },
            { x: 650, y: 120, width: 610, height: 360, type: 'placeholder', title: '核心指标 2' },
            { x: 1280, y: 120, width: 620, height: 360, type: 'placeholder', title: '核心指标 3' },
            { x: 20, y: 500, width: 1880, height: 560, type: 'placeholder', title: '详细数据展示区' }
        ]
    },
    {
        id: 'triple-column-topmenu',
        name: '三栏布局 (含顶栏)',
        description: '左中右三栏等分布局',
        thumbnail: '|||',
        layout: [
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '顶部导航菜单' },
            { x: 20, y: 120, width: 610, height: 940, type: 'placeholder', title: '左栏区域' },
            { x: 650, y: 120, width: 610, height: 940, type: 'placeholder', title: '中栏区域' },
            { x: 1280, y: 120, width: 620, height: 940, type: 'placeholder', title: '右栏区域' }
        ]
    },
    {
        id: 'asymmetric-modern-topmenu',
        name: '不对称现代 (含顶栏)',
        description: '左宽右窄，层次分明',
        thumbnail: '🎨',
        layout: [
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '顶部导航菜单' },
            // 左侧大区域
            { x: 20, y: 120, width: 1200, height: 460, type: 'placeholder', title: '主要数据展示' },
            { x: 20, y: 600, width: 1200, height: 460, type: 'placeholder', title: '趋势分析图表' },
            // 右侧小卡片组
            { x: 1240, y: 120, width: 660, height: 220, type: 'placeholder', title: '实时监控' },
            { x: 1240, y: 360, width: 660, height: 220, type: 'placeholder', title: '状态统计' },
            { x: 1240, y: 600, width: 660, height: 220, type: 'placeholder', title: '告警信息' },
            { x: 1240, y: 840, width: 660, height: 220, type: 'placeholder', title: '操作记录' }
        ]
    },
    {
        id: 'golden-ratio-topmenu',
        name: '黄金分割 (含顶栏)',
        description: '基于黄金比例的美学布局',
        thumbnail: '✨',
        layout: [
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '顶部导航菜单' },
            // 左侧主区
            { x: 20, y: 120, width: 1160, height: 460, type: 'placeholder', title: '主要图表区' },
            { x: 20, y: 600, width: 1160, height: 460, type: 'placeholder', title: '数据详情区' },
            // 右侧辅助区
            { x: 1200, y: 120, width: 700, height: 300, type: 'placeholder', title: '关键指标 1' },
            { x: 1200, y: 440, width: 700, height: 300, type: 'placeholder', title: '关键指标 2' },
            { x: 1200, y: 760, width: 700, height: 300, type: 'placeholder', title: '关键指标 3' }
        ]
    },
    {
        id: 'masonry-style-topmenu',
        name: '瀑布流式 (含顶栏)',
        description: '错落有致的卡片布局',
        thumbnail: '🧱',
        layout: [
            { x: 20, y: 20, width: 1880, height: 80, type: 'placeholder', title: '顶部导航菜单' },
            // 第一列
            { x: 20, y: 120, width: 450, height: 260, type: 'placeholder', title: '卡片 1' },
            { x: 20, y: 400, width: 450, height: 340, type: 'placeholder', title: '卡片 2' },
            { x: 20, y: 760, width: 450, height: 300, type: 'placeholder', title: '卡片 3' },
            // 第二列
            { x: 490, y: 120, width: 450, height: 340, type: 'placeholder', title: '卡片 4' },
            { x: 490, y: 480, width: 450, height: 260, type: 'placeholder', title: '卡片 5' },
            { x: 490, y: 760, width: 450, height: 300, type: 'placeholder', title: '卡片 6' },
            // 第三列
            { x: 960, y: 120, width: 450, height: 280, type: 'placeholder', title: '卡片 7' },
            { x: 960, y: 420, width: 450, height: 340, type: 'placeholder', title: '卡片 8' },
            { x: 960, y: 780, width: 450, height: 280, type: 'placeholder', title: '卡片 9' },
            // 第四列
            { x: 1430, y: 120, width: 470, height: 320, type: 'placeholder', title: '卡片 10' },
            { x: 1430, y: 460, width: 470, height: 280, type: 'placeholder', title: '卡片 11' },
            { x: 1430, y: 760, width: 470, height: 300, type: 'placeholder', title: '卡片 12' }
        ]
    }
]

export const layoutTemplates = [
    // {
    //     category: '通用布局',
    //     templates: basicTemplates
    // },
    {
        category: '顶部菜单布局',
        templates: topMenuTemplates
    }
]

export const getLayoutTemplates = () => layoutTemplates

// ========== 大屏项目模板（多页面） ==========
export const projectTemplates = [
    {
        id: 'smart-screen',
        name: '智慧大屏',
        description: '标题 + 左右可视化 + 中间三维/图表，含3个页面',
        thumbnail: '🏢',
        pages: [
            {
                name: '主控大屏',
                layout: [
                    { x: 20, y: 20, width: 1880, height: 80, title: '项目大标题' },
                    { x: 20, y: 120, width: 400, height: 470, title: '左侧可视化 1' },
                    { x: 20, y: 610, width: 400, height: 450, title: '左侧可视化 2' },
                    { x: 440, y: 120, width: 1040, height: 940, title: '中央三维场景' },
                    { x: 1500, y: 120, width: 400, height: 470, title: '右侧可视化 1' },
                    { x: 1500, y: 610, width: 400, height: 450, title: '右侧可视化 2' }
                ]
            },
            {
                name: '数据监控',
                layout: [
                    { x: 20, y: 20, width: 1880, height: 80, title: '数据监控' },
                    { x: 20, y: 120, width: 930, height: 470, title: '实时数据图表 1' },
                    { x: 970, y: 120, width: 930, height: 470, title: '实时数据图表 2' },
                    { x: 20, y: 610, width: 930, height: 450, title: '趋势分析' },
                    { x: 970, y: 610, width: 930, height: 450, title: '统计汇总' }
                ]
            },
            {
                name: '统计报表',
                layout: [
                    { x: 20, y: 20, width: 1880, height: 80, title: '统计报表' },
                    { x: 20, y: 120, width: 610, height: 300, title: '指标卡片 1' },
                    { x: 650, y: 120, width: 610, height: 300, title: '指标卡片 2' },
                    { x: 1280, y: 120, width: 620, height: 300, title: '指标卡片 3' },
                    { x: 20, y: 440, width: 1880, height: 620, title: '详细报表区' }
                ]
            }
        ]
    },
    {
        id: 'data-analysis',
        name: '数据分析中心',
        description: '专注数据可视化与分析，含2个页面',
        thumbnail: '📈',
        pages: [
            {
                name: '总览',
                layout: [
                    { x: 20, y: 20, width: 1880, height: 80, title: '数据分析中心' },
                    { x: 20, y: 120, width: 450, height: 200, title: 'KPI 1' },
                    { x: 490, y: 120, width: 450, height: 200, title: 'KPI 2' },
                    { x: 960, y: 120, width: 450, height: 200, title: 'KPI 3' },
                    { x: 1430, y: 120, width: 470, height: 200, title: 'KPI 4' },
                    { x: 20, y: 340, width: 1240, height: 720, title: '主数据图表' },
                    { x: 1280, y: 340, width: 620, height: 350, title: '分类统计' },
                    { x: 1280, y: 710, width: 620, height: 350, title: '排行榜' }
                ]
            },
            {
                name: '详细分析',
                layout: [
                    { x: 20, y: 20, width: 1880, height: 80, title: '详细分析' },
                    { x: 20, y: 120, width: 930, height: 470, title: '对比分析' },
                    { x: 970, y: 120, width: 930, height: 470, title: '趋势预测' },
                    { x: 20, y: 610, width: 1880, height: 450, title: '数据明细表' }
                ]
            }
        ]
    },
    {
        id: 'ops-monitor',
        name: '运维监控平台',
        description: '实时监控 + 告警 + 设备管理，含3个页面',
        thumbnail: '🛡️',
        pages: [
            {
                name: '实时监控',
                layout: [
                    { x: 20, y: 20, width: 1880, height: 80, title: '运维监控平台' },
                    { x: 20, y: 120, width: 1240, height: 600, title: '地图/拓扑视图' },
                    { x: 1280, y: 120, width: 620, height: 290, title: '系统状态' },
                    { x: 1280, y: 430, width: 620, height: 290, title: '性能指标' },
                    { x: 20, y: 740, width: 930, height: 320, title: '实时日志' },
                    { x: 970, y: 740, width: 930, height: 320, title: '告警列表' }
                ]
            },
            {
                name: '告警管理',
                layout: [
                    { x: 20, y: 20, width: 1880, height: 80, title: '告警管理' },
                    { x: 20, y: 120, width: 450, height: 200, title: '严重告警' },
                    { x: 490, y: 120, width: 450, height: 200, title: '警告' },
                    { x: 960, y: 120, width: 450, height: 200, title: '提示' },
                    { x: 1430, y: 120, width: 470, height: 200, title: '已处理' },
                    { x: 20, y: 340, width: 1880, height: 720, title: '告警详情列表' }
                ]
            },
            {
                name: '设备管理',
                layout: [
                    { x: 20, y: 20, width: 1880, height: 80, title: '设备管理' },
                    { x: 20, y: 120, width: 620, height: 940, title: '设备列表' },
                    { x: 660, y: 120, width: 1240, height: 470, title: '设备详情/3D模型' },
                    { x: 660, y: 610, width: 620, height: 450, title: '运行数据' },
                    { x: 1300, y: 610, width: 600, height: 450, title: '维护记录' }
                ]
            }
        ]
    }
]

export const getProjectTemplates = () => projectTemplates
