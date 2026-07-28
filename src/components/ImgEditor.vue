<template>
    <div class="img-editor">
        <!-- 图片预览 -->
        <div class="preview-section">
            <div class="preview-container" :class="{ 'drag-over': isDragOver, 'has-image': hasImage }"
                @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">
                <template v-if="hasImage">
                    <img :src="currentSrc" alt="预览" class="preview-image" />
                    <div class="preview-actions">
                        <el-button size="small" type="danger" @click="clearImage">
                            <el-icon>
                                <Delete />
                            </el-icon>
                            清除
                        </el-button>
                    </div>
                </template>
                <template v-else>
                    <div class="upload-placeholder" @click="triggerFileInput">
                        <el-icon :size="32">
                            <Picture />
                        </el-icon>
                        <p class="main-text">点击上传或拖入图片</p>
                        <p class="sub-text">支持 JPG、PNG、SVG 格式</p>
                    </div>
                </template>
                <input ref="fileInput" type="file" accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
                    class="hidden-input" @change="handleFileSelect" />
            </div>
        </div>

        <!-- 图片 URL 输入 -->
        <el-form-item label="图片地址">
            <el-input v-model="localSrc" placeholder="输入图片 URL 或上传图片" clearable @change="handleUrlChange">
                <template #prefix>
                    <el-icon>
                        <Link />
                    </el-icon>
                </template>
            </el-input>
            <div class="hint-text">输入网络图片地址或将图片拖入上方区域</div>
        </el-form-item>

        <!-- 图片适配模式 -->
        <el-form-item label="适配模式">
            <el-select v-model="localObjectFit" placeholder="选择适配模式" style="width: 100%;">
                <el-option label="包含 (Contain)" value="contain" />
                <el-option label="覆盖 (Cover)" value="cover" />
                <el-option label="填充 (Fill)" value="fill" />
                <el-option label="原始 (None)" value="none" />
                <el-option label="缩小适应 (Scale-down)" value="scale-down" />
            </el-select>
        </el-form-item>

        <!-- 对象位置 -->
        <el-form-item label="对象位置">
            <el-select v-model="localObjectPosition" placeholder="选择对象位置" style="width: 100%;">
                <el-option label="居中" value="center" />
                <el-option label="左上" value="top left" />
                <el-option label="顶部居中" value="top center" />
                <el-option label="右上" value="top right" />
                <el-option label="左侧居中" value="center left" />
                <el-option label="右侧居中" value="center right" />
                <el-option label="左下" value="bottom left" />
                <el-option label="底部居中" value="bottom center" />
                <el-option label="右下" value="bottom right" />
            </el-select>
        </el-form-item>

        <!-- 圆角 -->
        <el-form-item label="圆角">
            <el-slider v-model="localBorderRadius" :min="0" :max="50" :step="1" show-input
                :show-input-controls="false" />
        </el-form-item>

        <!-- 背景颜色 -->
        <el-form-item label="背景色">
            <el-color-picker v-model="localBackgroundColor" show-alpha />
        </el-form-item>

        <!-- 是否显示阴影 -->
        <el-form-item label="显示阴影">
            <el-switch v-model="localShadow" />
        </el-form-item>

        <!-- 备用文本 -->
        <el-form-item label="备用文本">
            <el-input v-model="localAlt" placeholder="图片无法显示时的替代文本" clearable />
        </el-form-item>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Delete, Picture, Link } from '@element-plus/icons-vue'

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({})
    }
})

const emit = defineEmits(['update:modelValue'])

// 本地状态
const isDragOver = ref(false)
const fileInput = ref(null)

// 本地属性值
const localSrc = ref('')
const localAlt = ref('图片')
const localObjectFit = ref('contain')
const localObjectPosition = ref('center')
const localBorderRadius = ref(0)
const localBackgroundColor = ref('transparent')
const localShadow = ref(false)

// 计算当前图片源
const currentSrc = computed(() => localSrc.value)

// 是否有图片
const hasImage = computed(() => !!localSrc.value)

// 初始化本地状态
let isUpdating = false
watch(() => props.modelValue, (newVal) => {
    if (!isUpdating && newVal) {
        isUpdating = true
        localSrc.value = newVal.src || ''
        localAlt.value = newVal.alt || '图片'
        localObjectFit.value = newVal.objectFit || 'contain'
        localObjectPosition.value = newVal.objectPosition || 'center'
        localBorderRadius.value = newVal.borderRadius || 0
        localBackgroundColor.value = newVal.backgroundColor || 'transparent'
        localShadow.value = newVal.shadow || false
        isUpdating = false
    }
}, { immediate: true, deep: true })

// 监听本地变化并同步到父组件
watch([localSrc, localAlt, localObjectFit, localObjectPosition, localBorderRadius, localBackgroundColor, localShadow], () => {
    if (!isUpdating) {
        emitUpdate()
    }
}, { deep: true })

// 发送更新事件
const emitUpdate = () => {
    emit('update:modelValue', {
        ...props.modelValue,
        src: localSrc.value,
        alt: localAlt.value,
        objectFit: localObjectFit.value,
        objectPosition: localObjectPosition.value,
        borderRadius: localBorderRadius.value,
        backgroundColor: localBackgroundColor.value,
        shadow: localShadow.value
    })
}

// 处理 URL 变化
const handleUrlChange = () => {
    // URL 已经通过 v-model 更新
}

// 触发文件选择
const triggerFileInput = () => {
    fileInput.value?.click()
}

// 处理拖拽悬停
const handleDragOver = (event) => {
    if (event.dataTransfer.types.includes('Files')) {
        isDragOver.value = true
    }
}

// 处理拖拽离开
const handleDragLeave = () => {
    isDragOver.value = false
}

// 处理拖放
const handleDrop = (event) => {
    isDragOver.value = false

    const files = event.dataTransfer.files
    if (files.length > 0) {
        processFile(files[0])
        return
    }

    // 处理拖入的 URL
    const url = event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain')
    if (url && isValidImageUrl(url)) {
        localSrc.value = url
    }
}

// 处理文件选择
const handleFileSelect = (event) => {
    const files = event.target.files
    if (files.length > 0) {
        processFile(files[0])
    }
    event.target.value = ''
}

// 处理文件
const processFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
        console.warn('不支持的图片格式:', file.type)
        return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
        localSrc.value = e.target.result
    }
    reader.onerror = () => {
        console.error('读取文件失败')
    }
    reader.readAsDataURL(file)
}

// 验证 URL 是否为有效图片 URL
const isValidImageUrl = (url) => {
    if (!url) return false
    const imageExtensions = /\.(jpg|jpeg|png|svg|gif|webp)(\?.*)?$/i
    return imageExtensions.test(url) || url.startsWith('data:image/')
}

// 清除图片
const clearImage = () => {
    localSrc.value = ''
}
</script>

<style scoped>
.img-editor {
    padding: 0;
}

.preview-section {
    margin-bottom: 16px;
}

.preview-container {
    width: 100%;
    height: 160px;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.3s ease;
    overflow: hidden;
    background: #fafbfc;
}

.preview-container.drag-over {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.1);
}

.preview-container.has-image {
    border-style: solid;
    border-color: #e0e0e0;
}

.preview-container:hover .preview-actions {
    opacity: 1;
}

.preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.preview-actions {
    position: absolute;
    bottom: 8px;
    right: 8px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #909399;
    transition: all 0.3s ease;
    width: 100%;
    height: 100%;
}

.upload-placeholder:hover {
    color: #409eff;
}

.upload-placeholder .el-icon {
    margin-bottom: 8px;
}

.upload-placeholder .main-text {
    font-size: 14px;
    margin: 0 0 4px 0;
}

.upload-placeholder .sub-text {
    font-size: 12px;
    margin: 0;
    opacity: 0.7;
}

.hidden-input {
    display: none;
}

.hint-text {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
}

:deep(.el-slider) {
    padding-right: 10px;
}

:deep(.el-slider__input) {
    width: 70px;
}
</style>
