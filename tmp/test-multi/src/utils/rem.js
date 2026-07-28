/**
 * REM 自适应方案
 * 基于设计稿宽度动态计算根字体大小
 * 
 * 使用方法：
 * 1. 在 main.js 中引入: import { initRem } from './utils/rem'
 * 2. 初始化: initRem()
 * 3. 在 CSS 中使用 rem 单位
 */

/**
 * 设置根字体大小
 * @param {number} designWidth 设计稿宽度，默认 1920
 * @param {number} baseFontSize 基准字体大小，默认 16
 */
export function setRem(designWidth = 1920, baseFontSize = 16) {
    const screenWidth = window.innerWidth
    const scale = screenWidth / designWidth
    const fontSize = baseFontSize * scale
    
    // 设置最小和最大字体限制，避免极端情况
    const minFontSize = 12
    const maxFontSize = 32
    const clampedFontSize = Math.max(minFontSize, Math.min(maxFontSize, fontSize))
    
    document.documentElement.style.fontSize = clampedFontSize + 'px'
}

/**
 * 初始化 REM 适配
 * @param {Object} options 配置选项
 * @param {number} options.designWidth 设计稿宽度
 * @param {number} options.baseFontSize 基准字体大小
 */
export function initRem(options = {}) {
    const { designWidth = 1920, baseFontSize = 16 } = options
    
    // 初始化设置
    setRem(designWidth, baseFontSize)
    
    // 监听窗口大小变化（防抖）
    let resizeTimer = null
    window.addEventListener('resize', () => {
        if (resizeTimer) {
            clearTimeout(resizeTimer)
        }
        resizeTimer = setTimeout(() => {
            setRem(designWidth, baseFontSize)
        }, 100)
    })
    
    // 监听方向变化（移动端）
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            setRem(designWidth, baseFontSize)
        }, 300)
    })
}

/**
 * px 转 rem 计算函数
 * @param {number} px 像素值
 * @param {number} baseFontSize 基准字体大小，默认 16
 * @returns {string} rem 值
 */
export function px2rem(px, baseFontSize = 16) {
    return (px / baseFontSize).toFixed(3) + 'rem'
}

/**
 * 批量转换 px 到 rem 的工具
 * @param {Object} styles 样式对象，值为 px 数字
 * @param {number} baseFontSize 基准字体大小
 * @returns {Object} 转换后的样式对象
 * 
 * @example
 * const styles = convertPxToRem({ width: 320, height: 240 })
 * // { width: '20rem', height: '15rem' }
 */
export function convertPxToRem(styles, baseFontSize = 16) {
    const result = {}
    for (const [key, value] of Object.entries(styles)) {
        if (typeof value === 'number') {
            result[key] = px2rem(value, baseFontSize)
        } else {
            result[key] = value
        }
    }
    return result
}


