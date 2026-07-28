import * as echarts from 'echarts'

// 导入主题 JSON 文件
import darkTheme from '../assets/echartTheme/dark.json'
import chalkTheme from '../assets/echartTheme/chalk.json'
import wonderlandTheme from '../assets/echartTheme/wonderland.json'

// 主题映射
const themes = {
    dark: darkTheme,
    chalk: chalkTheme,
    wonderland: wonderlandTheme
}

// 注册所有自定义主题
export const registerCustomThemes = () => {
    Object.entries(themes).forEach(([name, theme]) => {
        try {
            echarts.registerTheme(name, theme)
            console.log(`✅ EChart theme "${name}" registered successfully`)
        } catch (error) {
            console.error(`❌ Failed to register theme "${name}":`, error)
        }
    })
}

// 获取所有可用主题列表
export const getAvailableThemes = () => {
    return [
        { label: '默认主题', value: '' },
        { label: '明亮主题 (light)', value: 'light' },
        { label: '暗黑主题 (dark)', value: 'dark' },
        { label: 'Chalk主题', value: 'chalk' },
        { label: 'Wonderland主题', value: 'wonderland' },
        { label: '复古主题 (vintage)', value: 'vintage' },
        { label: '马卡龙主题 (macarons)', value: 'macarons' },
        { label: '信息图主题 (infographic)', value: 'infographic' },
        { label: '光辉主题 (shine)', value: 'shine' },
        { label: '罗马主题 (roma)', value: 'roma' }
    ]
}
