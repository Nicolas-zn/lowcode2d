/**
 * 屏幕适配配置文件
 * 根据项目需求选择合适的适配方案
 */

export const screenConfig = {
    // ===== 当前使用的适配方案 =====
    // 可选值: 'scale' | 'rem' | 'vwvh' | 'none'
    adaptationMode: 'scale',
    
    // ===== Scale 缩放方案配置 =====
    scale: {
        // 设计稿宽度
        designWidth: 1920,
        // 设计稿高度
        designHeight: 1080,
        // 是否自动缩放（预览模式用）
        autoScale: true,
        // 缩放策略: 'contain' 完全显示 | 'cover' 填满屏幕
        scaleMode: 'contain'
    },
    
    // ===== REM 方案配置 =====
    rem: {
        // 设计稿宽度
        designWidth: 1920,
        // 基准字体大小
        baseFontSize: 16,
        // 最小字体大小
        minFontSize: 12,
        // 最大字体大小
        maxFontSize: 32
    },
    
    // ===== VW/VH 方案配置 =====
    vwvh: {
        // 设计稿宽度
        designWidth: 1920,
        // 设计稿高度
        designHeight: 1080
    },
    
    // ===== 响应式断点配置 =====
    breakpoints: {
        xs: 576,   // 手机
        sm: 768,   // 平板竖屏
        md: 1024,  // 平板横屏
        lg: 1280,  // 笔记本
        xl: 1920,  // 台式机
        xxl: 2560, // 2K 显示器
        xxxl: 3840 // 4K 显示器
    },
    
    // ===== 组件默认尺寸配置 =====
    component: {
        // 默认宽度
        defaultWidth: 640,
        // 默认高度
        defaultHeight: 320,
        // 最小宽度
        minWidth: 200,
        // 最小高度
        minHeight: 150,
        // 是否响应式调整
        responsive: false
    },
    
    // ===== 画布配置 =====
    canvas: {
        // 画布宽度（编辑模式）
        width: 1920,
        // 画布高度（编辑模式）
        height: 1080,
        // 画布背景色
        backgroundColor: '#1a1a1a',
        // 网格大小
        gridSize: 10,
        // 是否显示网格
        showGrid: false
    },
    
    // ===== 性能优化配置 =====
    performance: {
        // resize 防抖延迟（毫秒）
        resizeDebounce: 100,
        // 缩放动画时长（毫秒）
        scaleTransition: 300,
        // 是否启用 GPU 加速
        useGPU: true
    }
}

/**
 * 获取当前屏幕类型
 * @returns {string} 屏幕类型
 */
export function getScreenType() {
    const width = window.innerWidth
    const { breakpoints } = screenConfig
    
    if (width >= breakpoints.xxxl) return '4k'
    if (width >= breakpoints.xxl) return '2k'
    if (width >= breakpoints.xl) return 'desktop'
    if (width >= breakpoints.lg) return 'laptop'
    if (width >= breakpoints.md) return 'tablet-landscape'
    if (width >= breakpoints.sm) return 'tablet-portrait'
    if (width >= breakpoints.xs) return 'mobile-landscape'
    return 'mobile-portrait'
}

/**
 * 获取响应式组件尺寸
 * @param {string} componentType 组件类型
 * @returns {Object} 组件尺寸 { width, height }
 */
export function getResponsiveComponentSize(componentType) {
    const screenType = getScreenType()
    const { defaultWidth, defaultHeight } = screenConfig.component
    
    // 根据屏幕类型调整组件尺寸
    const sizeMap = {
        '4k': { scale: 2 },
        '2k': { scale: 1.5 },
        'desktop': { scale: 1 },
        'laptop': { scale: 0.8 },
        'tablet-landscape': { scale: 0.6 },
        'tablet-portrait': { scale: 0.5 },
        'mobile-landscape': { scale: 0.4 },
        'mobile-portrait': { scale: 0.3 }
    }
    
    const { scale } = sizeMap[screenType] || { scale: 1 }
    
    return {
        width: Math.floor(defaultWidth * scale),
        height: Math.floor(defaultHeight * scale)
    }
}

/**
 * 导出默认配置
 */
export default screenConfig


