// EChart 调色盘配置
// 颜色来自对应的主题 JSON 文件

// EChart 调色盘配置
// 颜色来自常见 ECharts / 可视化主题风格整理

export const colorPalettes = {
    // ===== 原有 =====
    dark: [
        '#dd6b66',
        '#759aa0',
        '#e69d87',
        '#8dc1a9',
        '#ea7e53',
        '#eedd78',
        '#73a373',
        '#73b9bc',
        '#7289ab',
        '#91ca8c',
        '#f49f42'
    ],

    chalk: [
        '#fc97af',
        '#87f7cf',
        '#f7f494',
        '#72ccff',
        '#f7c5a0',
        '#d4a4eb',
        '#d2f5a6',
        '#76f2f2'
    ],

    wonderland: [
        '#4ea397',
        '#22c3aa',
        '#7bd9a5',
        '#d0648a',
        '#f58db2',
        '#f2b3c9'
    ],

    // ===== 新增 =====

    // 科技蓝（科技 / 后台 / BI）
    techBlue: [
        '#5470c6',
        '#91cc75',
        '#fac858',
        '#ee6666',
        '#73c0de',
        '#3ba272',
        '#fc8452',
        '#9a60b4',
        '#ea7ccc'
    ],

    // 商务稳重（企业报表 / 金融）
    business: [
        '#2f4554',
        '#61a0a8',
        '#d48265',
        '#91c7ae',
        '#749f83',
        '#ca8622',
        '#bda29a',
        '#6e7074',
        '#546570'
    ],

    // 高对比（大屏 / 监控 / 指挥中心）
    contrast: [
        '#ff4d4f',
        '#ffa940',
        '#fadb14',
        '#73d13d',
        '#36cfc9',
        '#40a9ff',
        '#597ef7',
        '#9254de'
    ],

    // 清新自然（环保 / 统计 / 轻量）
    fresh: [
        '#6bc5b8',
        '#8fd3a6',
        '#b6e2a1',
        '#e4f1a1',
        '#ffd972',
        '#fcbad3',
        '#cdb4db',
        '#a2d2ff'
    ],

    // 大屏霓虹（暗色背景 / 科幻）
    neon: [
        '#00eaff',
        '#00ff9c',
        '#ffe600',
        '#ff7a00',
        '#ff3d81',
        '#a855f7',
        '#38bdf8'
    ],

    // 莫兰迪（低饱和 / 高级感）
    morandi: [
        '#8e9aaf',
        '#cbc0d3',
        '#efd3d7',
        '#feeafa',
        '#dee2ff',
        '#cddafd',
        '#dfe7fd',
        '#e2ece9'
    ],

    // 暖色系（销售 / 增长 / 能源）
    warm: [
        '#c23531',
        '#e07b39',
        '#f2a93b',
        '#f9d423',
        '#d4e157',
        '#8bc34a',
        '#4caf50'
    ]
}


// 获取调色盘列表
// 获取调色盘列表
export const getColorPaletteOptions = () => {
    return [
        { label: '默认调色盘', value: '' },
        { label: 'Dark 调色盘', value: 'dark' },
        { label: 'Chalk 调色盘', value: 'chalk' },
        { label: 'Wonderland 调色盘', value: 'wonderland' },

        { label: '科技蓝 TechBlue', value: 'techBlue' },
        { label: '商务 Business', value: 'business' },
        { label: '高对比 Contrast', value: 'contrast' },
        { label: '清新 Fresh', value: 'fresh' },
        { label: '霓虹 Neon', value: 'neon' },
        { label: '莫兰迪 Morandi', value: 'morandi' },
        { label: '暖色 Warm', value: 'warm' }
    ]
}
