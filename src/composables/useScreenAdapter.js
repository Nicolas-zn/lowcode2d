import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 屏幕自适应 Hook
 * @param {Object} options 配置选项
 * @param {number} options.designWidth 设计稿宽度，默认 1920
 * @param {number} options.designHeight 设计稿高度，默认 1080
 * @param {boolean} options.autoScale 是否自动缩放，默认 true
 */
export function useScreenAdapter(options = {}) {
    const {
        designWidth = 1920,
        designHeight = 1080,
        autoScale = true
    } = options

    const scale = ref(1)
    const width = ref(designWidth)
    const height = ref(designHeight)

    // 计算缩放比例
    const calcScale = () => {
        if (!autoScale) {
            scale.value = 1
            width.value = window.innerWidth
            height.value = window.innerHeight
            return
        }

        const screenWidth = window.innerWidth
        const screenHeight = window.innerHeight

        // 计算宽高比
        const scaleX = screenWidth / designWidth
        const scaleY = screenHeight / designHeight

        // 使用较小的缩放比例，确保内容完全可见
        const newScale = Math.min(scaleX, scaleY)
        
        scale.value = newScale
        width.value = designWidth
        height.value = designHeight
    }

    // 防抖函数
    let resizeTimer = null
    const handleResize = () => {
        if (resizeTimer) {
            clearTimeout(resizeTimer)
        }
        resizeTimer = setTimeout(() => {
            calcScale()
        }, 100)
    }

    onMounted(() => {
        calcScale()
        window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
        if (resizeTimer) {
            clearTimeout(resizeTimer)
        }
    })

    return {
        scale,
        width,
        height
    }
}


