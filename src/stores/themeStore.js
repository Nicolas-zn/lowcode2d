import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
    // 主题模式：'light' | 'dark' | 'tech' | 'auto'
    const themeMode = ref('dark')

    // 当前应用的主题：'light' | 'dark' | 'tech'
    const currentTheme = ref('dark')

    // 浏览器是否偏好暗色主题
    const prefersDark = ref(false)

    // 是否为暗色主题
    const isDark = computed(() => currentTheme.value === 'dark')

    // 是否为科技风主题
    const isTech = computed(() => currentTheme.value === 'tech')

    // MediaQueryList 对象
    let mediaQuery = null

    /**
     * 初始化主题系统
     */
    const initTheme = () => {
        // 检查浏览器是否支持 matchMedia
        if (window.matchMedia) {
            mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            prefersDark.value = mediaQuery.matches

            // 监听浏览器主题变化
            const handleChange = (e) => {
                prefersDark.value = e.matches
                if (themeMode.value === 'auto') {
                    applyTheme()
                }
            }

            // 使用 addEventListener（现代浏览器）
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleChange)
            } else {
                // 兼容旧浏览器
                mediaQuery.addListener(handleChange)
            }
        }

        // 应用主题
        applyTheme()
    }

    /**
     * 应用主题到DOM
     */
    const applyTheme = () => {
        let theme = themeMode.value

        // 如果是 auto 模式，根据浏览器偏好决定
        if (theme === 'auto') {
            theme = prefersDark.value ? 'dark' : 'light'
        }

        currentTheme.value = theme

        // 设置 HTML 根元素的 data-theme 属性
        document.documentElement.setAttribute('data-theme', theme)

        // 移除所有主题类名
        document.documentElement.classList.remove('light-theme', 'dark-theme', 'tech-theme')

        // 添加对应的主题类名
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-theme')
        } else if (theme === 'tech') {
            document.documentElement.classList.add('tech-theme')
        } else {
            document.documentElement.classList.add('light-theme')
        }
    }

    /**
     * 设置主题模式
     * @param {'light' | 'dark' | 'tech' | 'auto'} mode 
     */
    const setTheme = (mode) => {
        if (!['light', 'dark', 'tech', 'auto'].includes(mode)) {
            console.error('Invalid theme mode:', mode)
            return
        }

        themeMode.value = mode
        applyTheme()
    }

    return {
        themeMode,
        currentTheme,
        isDark,
        isTech,
        prefersDark,
        initTheme,
        setTheme
    }
}, {
    persist: {
        pick: ['themeMode']
    }
})
