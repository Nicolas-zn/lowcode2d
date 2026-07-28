<template>
    <div class="preview-view">
        <!-- 右上角悬浮全屏按钮 -->
        <div class="fullscreen-btn" :class="{ 'is-fullscreen': isFullscreen }">
            <el-button :icon="isFullscreen ? Close : FullScreen" @click="toggleFullscreen"
                :type="isFullscreen ? 'danger' : 'primary'" circle size="large"
                :title="isFullscreen ? '退出全屏' : '全屏预览'" />
        </div>

        <ScreenState v-if="loading" type="loading" title="正在准备预览" description="正在读取当前编辑器中的页面、组件和项目配置。" />

        <ScreenState v-else-if="error" type="error" title="预览数据加载失败" :description="error">
            <template #actions>
                <el-button type="primary" @click="$router.push('/workspace')">返回工作区</el-button>
                <el-button @click="reloadPreview">重新加载</el-button>
            </template>
        </ScreenState>

        <!-- 大屏画布容器 -->
        <div v-else-if="hasComponents" class="screen-container">
            <div class="screen-canvas" :style="canvasStyle">
                <CanvasPanel :readonly="true" />
            </div>
        </div>

        <!-- 空状态 -->
        <ScreenState v-else type="empty" title="当前页面暂无组件" description="请返回编辑器添加组件，或导入已有项目配置后再预览。">
            <template #actions>
                <el-button type="primary" @click="$router.push('/workspace')">返回工作区</el-button>
            </template>
        </ScreenState>

        <!-- 浮动页面切换菜单（仅在没有MenuBrick时显示，只显示当前项目的页面） -->
        <div v-if="currentProjectPages.length > 1 && !hasMenuComponent" class="page-switcher">
            <div v-for="page in currentProjectPages" :key="page.id" class="page-btn"
                :class="{ active: page.id === panelStore.pages[panelStore.currentPageIndex]?.id }" @click="switchLocalPage(page)">
                {{ page.name }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePanelStore } from '../stores/panelStore'
import CanvasPanel from '../components/CanvasPanel.vue'
import ScreenState from '../components/common/ScreenState.vue'
import { FullScreen, Close } from '@element-plus/icons-vue'

const panelStore = usePanelStore()
const designWidth = computed(() => panelStore.projectSettings?.designWidth || 1920)
const designHeight = computed(() => panelStore.projectSettings?.designHeight || 1080)
const designWidthPx = computed(() => `${designWidth.value}px`)
const designHeightPx = computed(() => `${designHeight.value}px`)

// 全屏状态
const isFullscreen = ref(false)
const loading = ref(true)
const error = ref('')

// 缩放比例
const scaleX = ref(1)
const scaleY = ref(1)

// 是否有组件
const hasComponents = computed(() => panelStore.components.length > 0)

// 过滤当前项目的页面
const currentProjectPages = computed(() => {
    const cp = panelStore.pages[panelStore.currentPageIndex]
    const projId = cp ? cp.projectId : null
    return panelStore.pages.filter(p => p.projectId === projId)
})

// 检查是否包含菜单组件（MenuBrick 或 HeaderMenuBrick）只限当前项目
const hasMenuComponent = computed(() => {
    return currentProjectPages.value.some(page =>
        page.components.some(c => c.type === 'MenuBrick' || c.type === 'HeaderMenuBrick')
    )
})

const switchLocalPage = (page) => {
    const index = panelStore.pages.findIndex(p => p.id === page.id)
    if (index !== -1) {
        panelStore.switchPage(index)
    }
}

// 计算缩放比例（独立 X/Y 拉伸填满屏幕）
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
    // 全屏切换后重新计算缩放
    setTimeout(calculateScale, 100)
}

// 监听窗口大小变化
const handleResize = () => {
    calculateScale()
}

const reloadPreview = () => {
    error.value = ''
    loading.value = true
    loadPreviewData()
    calculateScale()
    loading.value = false
}

// 从 localStorage 加载预览数据
const loadPreviewData = () => {
    try {
        const savedData = localStorage.getItem('lowcode2d_preview_data')
        if (!savedData) {
            throw new Error('未找到预览数据，请从编辑器点击“预览”重新打开。')
        }

        const previewData = JSON.parse(savedData)

        if (previewData.pages && Array.isArray(previewData.pages)) {
            // 多页面格式
            panelStore.pages = previewData.pages.map(page => ({
                ...page,
                components: (page.components || []).filter(c => c.type !== 'PlaceholderBrick')
            }))
            const savedIndex = Number.isInteger(previewData.currentPageIndex)
                ? previewData.currentPageIndex
                : 0
            panelStore.currentPageIndex = Math.min(Math.max(savedIndex, 0), panelStore.pages.length - 1)
            if (previewData.projectSettingsMap) {
                panelStore.projectSettingsMap = previewData.projectSettingsMap
            } else if (previewData.projectSettings) {
                panelStore.projectSettings = previewData.projectSettings
            }
            console.log('预览数据加载成功，共', previewData.pages.length, '个页面')
        } else if (previewData.components && Array.isArray(previewData.components)) {
            // 旧格式兼容
            panelStore.pages = [{
                id: Date.now(),
                name: '页面 1',
                components: previewData.components.filter(c => c.type !== 'PlaceholderBrick')
            }]
            panelStore.currentPageIndex = 0
            if (previewData.projectSettings) {
                panelStore.projectSettings = previewData.projectSettings
            }
            console.log('预览数据加载成功（旧格式），共', panelStore.components.length, '个组件')
        } else {
            throw new Error('预览数据格式不正确，请返回编辑器重新生成预览。')
        }
    } catch (err) {
        console.error('加载预览数据失败:', err)
        error.value = err.message || '加载预览数据失败'
    }
}

onMounted(() => {
    // 从 localStorage 读取预览数据
    loadPreviewData()

    // 计算初始缩放
    calculateScale()

    // 添加事件监听
    window.addEventListener('resize', handleResize)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    loading.value = false
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.preview-view {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
}

/* 动画背景效果（与 HashView 一致） */
.preview-view::before {
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

    0%,
    100% {
        opacity: 0.5;
    }

    50% {
        opacity: 0.8;
    }
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

/* 全屏时按钮样式 */
.fullscreen-btn.is-fullscreen {
    opacity: 0.3;
}

.fullscreen-btn.is-fullscreen:hover {
    opacity: 1;
}

/* 画布容器（铺满屏幕） */
.screen-container {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 1;
    overflow: hidden;
}

/* 画布样式（与 HashView 一致） */
.screen-canvas {
    position: relative;
    background: #ffffff;
    box-shadow:
        0 0 60px rgba(0, 0, 0, 0.3),
        0 0 120px rgba(102, 126, 234, 0.2);
    transition: all 0.3s ease;
    border-radius: 4px;
    overflow: hidden;
}

/* 大屏模式：只显示canvas-content，隐藏其他层级（与 HashView 一致） */
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
.screen-canvas :deep(.placeholder-hint),
.screen-canvas :deep(.placeholder-item) {
    display: none !important;
    visibility: hidden !important;
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
</style>
