<template>
    <el-dialog v-model="dialogVisible" title="导出配置" width="720px" :close-on-click-modal="false" @close="handleClose">
        <div class="export-dialog">
            <!-- 导出格式选择 -->
            <div class="export-section">
                <div class="section-title">
                    <i class="bi bi-file-earmark-arrow-down"></i>
                    选择导出格式
                </div>
                <div class="format-grid">
                    <div v-for="format in exportFormats" :key="format.value" class="format-card"
                        :class="{ active: selectedFormats.includes(format.value) }" @click="toggleFormat(format.value)">
                        <div class="format-icon">
                            <i :class="format.icon"></i>
                        </div>
                        <div class="format-info">
                            <div class="format-name">{{ format.name }}</div>
                            <div class="format-desc">{{ format.desc }}</div>
                        </div>
                        <div class="format-check">
                            <el-checkbox :model-value="selectedFormats.includes(format.value)" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- 导出配置 -->
            <div class="export-section" v-if="showAdvancedOptions">
                <div class="section-title">
                    <i class="bi bi-gear"></i>
                    导出选项
                </div>

                <el-form :model="exportOptions" label-width="100px" size="default">
                    <!-- 通用选项 -->
                    <el-form-item label="文件名">
                        <el-input v-model="exportOptions.fileName" placeholder="dashboard" />
                    </el-form-item>

                    <!-- HTML 选项 -->
                    <template v-if="selectedFormats.includes('html')">
                        <el-divider content-position="left">HTML 选项</el-divider>
                        <el-form-item label="CDN 源">
                            <el-select v-model="exportOptions.cdn" style="width: 100%;">
                                <el-option v-for="(cdn, key) in cdnOptions" :key="key" :label="cdn.name" :value="key" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="主题">
                            <el-select v-model="exportOptions.theme" style="width: 100%;">
                                <el-option label="暗黑模式" value="dark" />
                                <el-option label="浅色模式" value="light" />
                                <el-option label="科技风格" value="tech" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="压缩代码">
                            <el-switch v-model="exportOptions.compressed" />
                        </el-form-item>
                    </template>

                    <!-- 图片选项 -->
                    <template v-if="selectedFormats.includes('png') || selectedFormats.includes('jpg')">
                        <el-divider content-position="left">图片选项</el-divider>
                        <el-form-item label="图片格式">
                            <el-radio-group v-model="exportOptions.imageFormat">
                                <el-radio value="png">PNG (无损)</el-radio>
                                <el-radio value="jpg">JPG (有损)</el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item label="缩放比例">
                            <el-slider v-model="exportOptions.scale" :min="1" :max="4" :step="0.5" :marks="scaleMarks"
                                show-stops />
                        </el-form-item>
                        <el-form-item label="图片质量" v-if="exportOptions.imageFormat === 'jpg'">
                            <el-slider v-model="exportOptions.quality" :min="0.1" :max="1" :step="0.1"
                                :format-tooltip="val => Math.round(val * 100) + '%'" />
                        </el-form-item>
                    </template>

                    <!-- PDF 选项 -->
                    <template v-if="selectedFormats.includes('pdf')">
                        <el-divider content-position="left">PDF 选项</el-divider>
                        <el-form-item label="页面方向">
                            <el-radio-group v-model="exportOptions.orientation">
                                <el-radio value="landscape">横向</el-radio>
                                <el-radio value="portrait">纵向</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </template>

                    <!-- 代码选项 -->
                    <template v-if="selectedFormats.includes('vue') || selectedFormats.includes('react')">
                        <el-divider content-position="left">代码选项</el-divider>
                        <el-form-item label="组件名称">
                            <el-input v-model="exportOptions.componentName" placeholder="Dashboard" />
                        </el-form-item>
                    </template>
                </el-form>
            </div>

            <!-- 导出预览 -->
            <div class="export-section">
                <div class="section-title">
                    <i class="bi bi-eye"></i>
                    导出预览
                </div>
                <div class="preview-info">
                    <div class="preview-item" v-for="format in selectedFormatDetails" :key="format.value">
                        <i :class="format.icon"></i>
                        <span>{{ format.name }}</span>
                        <span class="file-name">{{ getFileName(format.value) }}</span>
                    </div>
                    <div class="preview-empty" v-if="selectedFormats.length === 0">
                        请选择至少一种导出格式
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="handleExport" :loading="exporting"
                    :disabled="selectedFormats.length === 0">
                    <i class="bi bi-download" style="margin-right: 6px;"></i>
                    {{ selectedFormats.length > 1 ? '批量导出' : '导出' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
    CDN_OPTIONS,
    exportToImage,
    exportToPDF,
    generateStandaloneHTML,
    generateVueComponent,
    generateReactComponent,
    batchExport,
    downloadFile,
    downloadBlob
} from '../utils/exportUtils.js'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    components: {
        type: Array,
        default: () => []
    },
    canvasElement: {
        type: Object,
        default: null
    },
    pages: {
        type: Array,
        default: () => []
    },
    projectSettings: {
        type: Object,
        default: () => ({})
    },
    projectSettingsMap: {
        type: Object,
        default: () => ({})
    }
})

const emit = defineEmits(['update:modelValue', 'export-complete'])

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

// 导出格式列表
const exportFormats = [
    {
        value: 'json',
        name: 'JSON 配置',
        desc: '项目配置文件，可再次导入编辑',
        icon: 'bi bi-filetype-json'
    },
    {
        value: 'html',
        name: '独立 HTML',
        desc: '包含所有依赖的单文件网页',
        icon: 'bi bi-filetype-html'
    },
    {
        value: 'png',
        name: 'PNG 图片',
        desc: '高清无损图片格式',
        icon: 'bi bi-filetype-png'
    },
    {
        value: 'jpg',
        name: 'JPG 图片',
        desc: '压缩图片格式，文件更小',
        icon: 'bi bi-filetype-jpg'
    },
    {
        value: 'pdf',
        name: 'PDF 文档',
        desc: '可打印的 PDF 文档',
        icon: 'bi bi-filetype-pdf'
    },
    {
        value: 'vue',
        name: 'Vue 组件',
        desc: 'Vue 3 组件源代码',
        icon: 'bi bi-filetype-vue'
    },
    {
        value: 'react',
        name: 'React 组件',
        desc: 'React JSX 组件源代码',
        icon: 'bi bi-filetype-jsx'
    }
]

// 选中的格式
const selectedFormats = ref(['json'])

// 导出选项
const exportOptions = ref({
    fileName: 'dashboard',
    // HTML 选项
    cdn: 'jsdelivr',
    theme: 'dark',
    compressed: false,
    // 图片选项
    imageFormat: 'png',
    scale: 2,
    quality: 0.9,
    // PDF 选项
    orientation: 'landscape',
    // 代码选项
    componentName: 'Dashboard'
})

// CDN 选项
const cdnOptions = CDN_OPTIONS

// 缩放标记
const scaleMarks = {
    1: '1x',
    2: '2x',
    3: '3x',
    4: '4x'
}

// 是否显示高级选项
const showAdvancedOptions = computed(() => {
    return selectedFormats.value.some(f =>
        ['html', 'png', 'jpg', 'pdf', 'vue', 'react'].includes(f)
    )
})

// 选中格式的详细信息
const selectedFormatDetails = computed(() => {
    return exportFormats.filter(f => selectedFormats.value.includes(f.value))
})

// 导出状态
const exporting = ref(false)

// 切换格式选择
const toggleFormat = (format) => {
    const index = selectedFormats.value.indexOf(format)
    if (index === -1) {
        selectedFormats.value.push(format)
    } else {
        selectedFormats.value.splice(index, 1)
    }
}

// 获取文件名
const getFileName = (format) => {
    const baseName = exportOptions.value.fileName || 'dashboard'
    const extensions = {
        json: '.json',
        html: '.html',
        png: '.png',
        jpg: '.jpg',
        pdf: '.pdf',
        vue: '.vue',
        react: '.jsx'
    }
    return baseName + (extensions[format] || '')
}

// 执行导出
const handleExport = async () => {
    if (selectedFormats.value.length === 0) {
        ElMessage.warning('请选择至少一种导出格式')
        return
    }

    exporting.value = true

    try {
        const formats = selectedFormats.value
        const options = {
            ...exportOptions.value,
            canvasWidth: props.projectSettings?.designWidth || 1920,
            canvasHeight: props.projectSettings?.designHeight || 1080,
            pages: props.pages,
            projectSettings: props.projectSettings,
            projectSettingsMap: props.projectSettingsMap
        }

        // 批量导出（多个格式）
        if (formats.length > 1) {
            await batchExport(props.components, formats, options)
            ElMessage.success('批量导出成功！')
        } else {
            // 单个格式导出
            const format = formats[0]
            await exportSingleFormat(format, options)
            ElMessage.success(`${getFormatName(format)} 导出成功！`)
        }

        emit('export-complete', { formats, options })
        handleClose()
    } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败: ' + error.message)
    } finally {
        exporting.value = false
    }
}

// 单个格式导出
const exportSingleFormat = async (format, options) => {
    const fileName = options.fileName || 'dashboard'

    switch (format) {
        case 'json': {
            const jsonData = {
                version: '1.0',
                createTime: new Date().toISOString(),
                pages: props.pages.map((page, index) => ({
                    name: page.name,
                    pageId: `page${index + 1}`,
                    components: page.components
                })),
                projectSettings: props.projectSettings
            }
            downloadFile(JSON.stringify(jsonData, null, 2), `${fileName}.json`, 'application/json')
            break
        }

        case 'html': {
            const html = generateStandaloneHTML(props.components, options)
            downloadFile(html, `${fileName}.html`, 'text/html')
            break
        }

        case 'png':
        case 'jpg': {
            if (!props.canvasElement) {
                throw new Error('无法获取画布元素')
            }
            const blob = await exportToImage(props.canvasElement, {
                format: options.imageFormat || format,
                scale: options.scale,
                quality: options.quality
            })
            downloadBlob(blob, `${fileName}.${format}`)
            break
        }

        case 'pdf': {
            if (!props.canvasElement) {
                throw new Error('无法获取画布元素')
            }
            const pdfBlob = await exportToPDF(props.canvasElement, {
                scale: options.scale,
                orientation: options.orientation
            })
            downloadBlob(pdfBlob, `${fileName}.pdf`)
            break
        }

        case 'vue': {
            const vueCode = generateVueComponent(props.components, options)
            downloadFile(vueCode, `${options.componentName || 'Dashboard'}.vue`, 'text/plain')
            break
        }

        case 'react': {
            const reactCode = generateReactComponent(props.components, options)
            downloadFile(reactCode, `${options.componentName || 'Dashboard'}.jsx`, 'text/plain')
            break
        }
    }
}

// 获取格式名称
const getFormatName = (format) => {
    const found = exportFormats.find(f => f.value === format)
    return found ? found.name : format
}

// 关闭对话框
const handleClose = () => {
    dialogVisible.value = false
}
</script>

<style scoped>
.export-dialog {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 10px;
}

.export-section {
    margin-bottom: 24px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-title i {
    color: var(--el-color-primary);
    font-size: 18px;
}

/* 格式卡片网格 */
.format-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.format-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--el-fill-color-light);
    border: 2px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.25s ease;
}

.format-card:hover {
    background: var(--el-fill-color);
    border-color: var(--el-color-primary-light-5);
}

.format-card.active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
}

.format-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-bg-color);
    border-radius: 10px;
    font-size: 22px;
    color: var(--el-color-primary);
}

.format-card.active .format-icon {
    background: var(--el-color-primary);
    color: #fff;
}

.format-info {
    flex: 1;
    min-width: 0;
}

.format-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
}

.format-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.format-check {
    flex-shrink: 0;
}

/* 预览区域 */
.preview-info {
    background: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 16px;
}

.preview-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px dashed var(--el-border-color-lighter);
}

.preview-item:last-child {
    border-bottom: none;
}

.preview-item i {
    font-size: 18px;
    color: var(--el-color-primary);
}

.preview-item span:first-of-type {
    font-weight: 500;
    color: var(--el-text-color-primary);
}

.preview-item .file-name {
    flex: 1;
    text-align: right;
    color: var(--el-text-color-secondary);
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
}

.preview-empty {
    color: var(--el-text-color-placeholder);
    text-align: center;
    padding: 20px;
}

/* 对话框底部 */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* Element Plus 样式覆盖 */
:deep(.el-divider__text) {
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

:deep(.el-form-item) {
    margin-bottom: 18px;
}

:deep(.el-slider__marks-text) {
    font-size: 12px;
}

/* 响应式 */
@media screen and (max-width: 768px) {
    .format-grid {
        grid-template-columns: 1fr;
    }
}
</style>
