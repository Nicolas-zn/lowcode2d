<template>
    <div class="toolbar">
        <div class="toolbar-group" aria-label="编辑历史">
            <el-button :icon="RefreshLeft" @click="handleUndo" :disabled="!canUndo" :size="buttonSize"
                :title="undoTooltip">
                撤销
            </el-button>

            <el-button :icon="RefreshRight" @click="handleRedo" :disabled="!canRedo" :size="buttonSize"
                :title="redoTooltip">
                重做
            </el-button>

            <el-button :icon="Clock" @click="emit('toggle-history')" :size="buttonSize" title="历史记录">
                历史
            </el-button>
        </div>

        <div class="toolbar-divider" />

        <div class="toolbar-group" aria-label="画布辅助">
            <el-button :icon="Grid" @click="handleToggleGrid" :size="buttonSize"
                :type="panelStore.showGrid ? 'primary' : 'default'" :title="panelStore.showGrid ? '隐藏网格' : '显示网格'">
                网格
            </el-button>
            <el-button :icon="ZoomOut" @click="emit('zoom-out')" :size="buttonSize" title="缩小画布" />
            <el-button :icon="FullScreen" @click="emit('zoom-fit')" :size="buttonSize" title="适应画布" />
            <span class="zoom-value">{{ canvasScalePercent }}%</span>
            <el-button :icon="Refresh" @click="emit('zoom-reset')" :size="buttonSize" title="重置为 100%" />
            <el-button :icon="ZoomIn" @click="emit('zoom-in')" :size="buttonSize" title="放大画布" />
        </div>

        <div class="toolbar-divider" />

        <div class="toolbar-group" aria-label="预览与交付">
            <el-button :icon="View" @click="handlePreview" :disabled="componentCount === 0" :size="buttonSize"
                title="预览大屏 (新标签页打开)">
                预览
            </el-button>

            <el-button :icon="Download" @click="emit('export-template')" :disabled="componentCount === 0"
                :size="buttonSize">
                导出
            </el-button>

            <el-button :icon="Picture" @click="emit('set-cover')" :disabled="coverLoading"
                :loading="coverLoading" :size="buttonSize" title="将当前页面截图设为项目封面">
                设为封面
            </el-button>

            <el-button type="primary" :icon="Share" @click="emit('publish-template')" :disabled="componentCount === 0"
                :size="buttonSize">
                发布
            </el-button>

            <el-dropdown trigger="click" @command="handleMoreCommand">
                <el-button :icon="MoreFilled" :size="buttonSize" title="更多操作">
                    更多
                </el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="load" :icon="Upload">导入项目</el-dropdown-item>
                        <el-dropdown-item command="clear" :icon="Delete" :disabled="componentCount === 0" divided>
                            清空画布
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>

        <div class="toolbar-divider" />

        <div class="theme-selector">
            <span class="theme-label">整体风格：</span>
            <el-select v-model="themeStore.themeMode" @change="handleThemeChange" :size="buttonSize"
                style="width: 120px;">
                <el-option label="浅色" value="light" />
                <el-option label="暗黑" value="dark" />
                <el-option label="科技风" value="tech" />
                <el-option label="自动" value="auto" />
            </el-select>
        </div>

        <!-- <div class="component-count">
            <el-icon>
                <Document />
            </el-icon>
            <span>{{ componentCount }} 个组件</span>
        </div> -->
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Download, Upload, Share, Delete, RefreshLeft, RefreshRight, Clock, View, Grid, MoreFilled, ZoomIn, ZoomOut, FullScreen, Refresh, Picture } from '@element-plus/icons-vue'
import { useThemeStore } from '../stores/themeStore'
import { usePanelStore } from '../stores/panelStore'
import { useHistoryStore } from '../stores/historyStore'

const router = useRouter()
const themeStore = useThemeStore()
const panelStore = usePanelStore()
const historyStore = useHistoryStore()

defineProps({
    componentCount: {
        type: Number,
        default: 0
    },
    canvasScalePercent: {
        type: Number,
        default: 100
    },
    coverLoading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits([
    'export-template',
    'load-template',
    'publish-template',
    'set-cover',
    'clear-all',
    'toggle-history',
    'zoom-in',
    'zoom-out',
    'zoom-reset',
    'zoom-fit'
])

// 撤销/重做状态
const canUndo = computed(() => historyStore.canUndo)
const canRedo = computed(() => historyStore.canRedo)

// 撤销/重做提示文本
const undoTooltip = computed(() => {
    if (!canUndo.value) return '撤销 (Ctrl+Z)'
    const action = historyStore.undoAction
    return action ? `撤销: ${action.description} (Ctrl+Z)` : '撤销 (Ctrl+Z)'
})

const redoTooltip = computed(() => {
    if (!canRedo.value) return '重做 (Ctrl+Y)'
    const action = historyStore.redoAction
    return action ? `重做: ${action.description} (Ctrl+Y)` : '重做 (Ctrl+Y)'
})

// 撤销
const handleUndo = () => {
    panelStore.undo()
}

// 重做
const handleRedo = () => {
    panelStore.redo()
}

// 根据屏幕分辨率动态计算按钮尺寸
const buttonSize = computed(() => {
    const screenWidth = window.screen.width
    if (screenWidth >= 3840) {
        // 4K 显示器
        return 'default'
    } else if (screenWidth >= 2560) {
        // 2K 显示器
        return 'default'
    } else {
        // 1080p 及以下
        return 'small'
    }
})

// 处理预览
const handlePreview = () => {
    // 保存所有页面数据到 localStorage
    const previewData = {
        pages: JSON.parse(JSON.stringify(panelStore.pages)),
        currentPageIndex: panelStore.currentPageIndex,
        projectSettings: JSON.parse(JSON.stringify(panelStore.projectSettings)),
        projectSettingsMap: JSON.parse(JSON.stringify(panelStore.projectSettingsMap)),
        timestamp: Date.now()
    }
    localStorage.setItem('lowcode2d_preview_data', JSON.stringify(previewData))

    // 在新标签页中打开预览
    const previewUrl = router.resolve({ name: 'preview' }).href
    window.open(previewUrl, '_blank')
}

// 处理主题切换
const handleThemeChange = (value) => {
    themeStore.setTheme(value)
}

const handleMoreCommand = (command) => {
    if (command === 'load') {
        emit('load-template')
        return
    }
    if (command === 'clear') {
        emit('clear-all')
    }
}

// 切换网格显示
const handleToggleGrid = () => {
    panelStore.toggleGrid()
}
</script>

<style scoped>
.toolbar {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: color-mix(in srgb, var(--lc-bg-panel) 94%, transparent);
    backdrop-filter: blur(12px);
    border-radius: var(--lc-radius-lg);
    border: 1px solid var(--lc-border-subtle);
    box-shadow: var(--lc-shadow-md);
    z-index: 1000;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.toolbar:hover {
    border-color: var(--lc-border-strong);
    box-shadow: var(--lc-shadow-lg);
}

.toolbar-group {
    display: flex;
    align-items: center;
    gap: 6px;
}

.toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--lc-border-subtle);
}

.zoom-value {
    min-width: 44px;
    color: var(--lc-text-secondary);
    font-size: var(--lc-font-size-caption);
    font-variant-numeric: tabular-nums;
    text-align: center;
    user-select: none;
}

.theme-selector {
    display: flex;
    align-items: center;
    gap: 8px;
}

.theme-label {
    color: var(--lc-text-secondary);
    font-size: var(--lc-font-size-caption);
    font-weight: 500;
    white-space: nowrap;
}

.component-count {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    color: #409eff;
    font-size: 14px;
    font-weight: 500;
}

.component-count .el-icon {
    font-size: 16px;
}

:deep(.el-button) {
    font-weight: 500;
    border-radius: var(--lc-radius-md);
}

:deep(.el-dropdown) {
    display: flex;
}

/* 4K 显示器适配 */
@media screen and (min-width: 3840px) {
    .toolbar {
        padding: 10px 12px;
        gap: 12px;
    }

    :deep(.el-button) {
        font-size: 16px;
        padding: 12px 20px;
    }

    :deep(.el-button .el-icon) {
        font-size: 18px;
    }

    .theme-label {
        font-size: 16px;
    }

    :deep(.el-select) {
        width: 140px !important;
    }
}

/* 2K 显示器适配 */
@media screen and (min-width: 2560px) and (max-width: 3839px) {
    .toolbar {
        padding: 9px 11px;
        gap: 10px;
    }

    :deep(.el-button) {
        font-size: 15px;
    }

    .theme-label {
        font-size: 15px;
    }

    :deep(.el-select) {
        width: 130px !important;
    }
}
</style>
