<template>
    <div class="hash-view">
        <!-- 右上角悬浮全屏按钮 -->
        <div v-if="templateLoaded" class="fullscreen-btn" :class="{ 'is-fullscreen': isFullscreen }">
            <el-button :icon="isFullscreen ? Close : FullScreen" @click="toggleFullscreen"
                :type="isFullscreen ? 'danger' : 'primary'" circle size="large"
                :title="isFullscreen ? '退出全屏' : '全屏预览'" />
        </div>

        <ScreenState v-if="loading" type="loading" title="正在加载大屏模板" description="正在获取发布模板、页面配置和组件数据。" />
        <ScreenState v-else-if="error" type="error" title="模板加载失败" :description="error">
            <template #actions>
                <el-button type="primary" @click="reloadTemplate">重试</el-button>
                <el-button @click="$router.push('/')">返回首页</el-button>
            </template>
        </ScreenState>
        <div v-else-if="templateLoaded && hasComponents" class="screen-container">
            <div class="screen-canvas" :style="canvasStyle">
                <CanvasPanel :readonly="true" />
            </div>
        </div>
        <ScreenState v-else-if="templateLoaded" type="empty" title="模板暂无组件" description="该发布链接已加载成功，但当前页面没有可展示的组件。" />

        <!-- 浮动页面切换菜单（仅在没有MenuBrick时显示） -->
        <div v-if="templateLoaded && panelStore.pages.length > 1 && !hasMenuComponent" class="page-switcher">
            <div v-for="(page, index) in panelStore.pages" :key="page.id" class="page-btn"
                :class="{ active: index === panelStore.currentPageIndex }" @click="panelStore.switchPage(index)">
                {{ page.name }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePanelStore } from '../stores/panelStore'
import CanvasPanel from '../components/CanvasPanel.vue'
import ScreenState from '../components/common/ScreenState.vue'
import { FullScreen, Close } from '@element-plus/icons-vue'
import { api } from '../lib/api'

const route = useRoute()
const panelStore = usePanelStore()

const loading = ref(true)
const error = ref(null)
const templateLoaded = ref(false)
const isFullscreen = ref(false)
const designWidth = computed(() => panelStore.projectSettings?.designWidth || 1920)
const designHeight = computed(() => panelStore.projectSettings?.designHeight || 1080)
const designWidthPx = computed(() => `${designWidth.value}px`)
const designHeightPx = computed(() => `${designHeight.value}px`)

// 缩放比例
const scaleX = ref(1)
const scaleY = ref(1)

const hasComponents = computed(() => panelStore.components.length > 0)

// 检查是否包含菜单组件
const hasMenuComponent = computed(() => {
    return panelStore.pages.some(page =>
        page.components.some(c => c.type === 'MenuBrick' || c.type === 'HeaderMenuBrick')
    )
})

const calculateScale = () => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    scaleX.value = windowWidth / designWidth.value
    scaleY.value = windowHeight / designHeight.value
}

// 画布样式
const canvasStyle = computed(() => {
    const settings = panelStore.projectSettings || {}
    const bgImage = settings.backgroundImage

    const styles = {
        width: designWidthPx.value,
        height: designHeightPx.value,
        transform: `scale(${scaleX.value}, ${scaleY.value})`,
        transformOrigin: 'top left',
        backgroundColor: settings.backgroundColor || '#ffffff'
    }

    if (bgImage) {
        styles.backgroundImage = `url(${bgImage})`
        styles.backgroundSize = `100% 100%`
        styles.backgroundPosition = `center center`
        styles.backgroundRepeat = `no-repeat`
    } else {
        styles.backgroundImage = `none`
    }

    return styles
})

// 切换全屏
const toggleFullscreen = async () => {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen()
            isFullscreen.value = true
        } else {
            await document.exitFullscreen()
            isFullscreen.value = false
        }
    } catch (err) {
        console.error('全屏切换失败:', err)
    }
}

// 监听全屏变化
const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
    setTimeout(calculateScale, 100)
}

// 监听窗口大小变化
const handleResize = () => {
    calculateScale()
}

const loadTemplate = async () => {
    try {
        loading.value = true
        error.value = null
        templateLoaded.value = false
        const hashValue = route.params.hashValue
        const data = await api.getTemplateByHash(hashValue)

        if (!data) {
            throw new Error('模板不存在或已被删除')
        }

        if (data.template) {
            const templateData = typeof data.template === 'string'
                ? JSON.parse(data.template)
                : data.template

            console.log('加载模板数据:', templateData)

            // 支持多页面格式
            if (templateData.pages && Array.isArray(templateData.pages)) {
                panelStore.pages = templateData.pages.map((page, index) => ({
                    id: page.pageId || page.id || `page_${Date.now()}_${index}`,
                    projectId: page.projectId || 'proj_1',
                    projectName: page.projectName || '项目 1',
                    name: page.name || `页面 ${index + 1}`,
                    components: (page.components || []).filter(c => c.type !== 'PlaceholderBrick')
                }))
                console.log('加载页面:', panelStore.pages.length, '个')
            } else if (Array.isArray(templateData.components)) {
                panelStore.pages = [{
                    id: 'page_1',
                    name: '页面 1',
                    components: templateData.components.filter(c => c.type !== 'PlaceholderBrick')
                }]
            } else if (Array.isArray(templateData)) {
                panelStore.pages = [{
                    id: 'page_1',
                    name: '页面 1',
                    components: templateData.filter(c => c.type !== 'PlaceholderBrick')
                }]
            }

            if (templateData.projectSettings) {
                panelStore.projectSettings = templateData.projectSettings
            }
            if (templateData.projectSettingsMap) {
                panelStore.projectSettingsMap = templateData.projectSettingsMap
            }

            panelStore.currentPageIndex = 0
            console.log('当前页面索引:', panelStore.currentPageIndex)
            console.log('当前页面组件数:', panelStore.components.length)
        }

        templateLoaded.value = true
        calculateScale()
    } catch (err) {
        console.error('加载模板失败:', err)
        error.value = err.message || '加载模板失败'
    } finally {
        loading.value = false
    }
}

const reloadTemplate = () => {
    loadTemplate()
}

onMounted(async () => {
    window.addEventListener('resize', handleResize)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    await loadTemplate()
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.hash-view {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
}

.hash-view::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    animation: bgAnimation 15s ease-in-out infinite;
    pointer-events: none;
}

@keyframes bgAnimation {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
}

/* 右上角悬浮全屏按钮 */
.fullscreen-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    opacity: 0.6;
    transition: all 0.3s ease;
}

.fullscreen-btn:hover {
    opacity: 1;
    transform: scale(1.1);
}

.fullscreen-btn .el-button {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.fullscreen-btn.is-fullscreen {
    opacity: 0.3;
}

.fullscreen-btn.is-fullscreen:hover {
    opacity: 1;
}

.screen-container {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 1;
    overflow: hidden;
}

.screen-canvas {
    position: relative;
    background: #ffffff;
    box-shadow: 0 0 60px rgba(0, 0, 0, 0.3), 0 0 120px rgba(102, 126, 234, 0.2);
    transition: all 0.3s ease;
    border-radius: 4px;
    overflow: hidden;
}

/* 浮动页面切换菜单 */
.page-switcher {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 1000;
    display: flex;
    gap: 8px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(12px);
    padding: 6px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.page-btn {
    padding: 8px 18px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    user-select: none;
}

.page-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.15);
}

.page-btn.active {
    color: #fff;
    background: var(--el-color-primary);
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

/* 大屏模式：只显示canvas-content，隐藏其他层级 */
.screen-canvas :deep(.canvas-panel) {
    width: 100%;
    height: 100%;
}

.screen-canvas :deep(.canvas-wrapper) {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    padding: 0 !important;
    overflow: hidden !important;
}

.screen-canvas :deep(.ruler-corner) {
    display: none !important;
}

.screen-canvas :deep(.canvas-noscroll) {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: transparent !important;
}

.screen-canvas :deep(.canvas-content) {
    /* 保持固定尺寸，由screen-canvas的不等比缩放填满屏幕 */
    transform: scale(1) !important;
    width: v-bind(designWidthPx) !important;
    height: v-bind(designHeightPx) !important;
    /* 隐藏网格辅助线 */
    background: transparent !important;
    background-image: none !important;
    background-size: 0 !important;
}

/* 隐藏所有可能的布局辅助线 */
.screen-canvas :deep(.layout-guide),
.screen-canvas :deep(.guide-line),
.screen-canvas :deep(.grid-line),
.screen-canvas :deep(.snap-line),
.screen-canvas :deep(.align-line),
.screen-canvas :deep(.component-actions) {
    display: none !important;
    visibility: hidden !important;
}

/* 隐藏placeholder占位符组件 */
.screen-canvas :deep(.placeholder-brick) {
    display: none !important;
    visibility: hidden !important;
}

/* 隐藏placeholder组件的所有内容 */
.screen-canvas :deep(.placeholder-content),
.screen-canvas :deep(.placeholder-icon),
.screen-canvas :deep(.placeholder-title),
.screen-canvas :deep(.placeholder-hint) {
    display: none !important;
    visibility: hidden !important;
}
</style>
