<template>
    <div class="img-brick" :class="{ 'drag-over': isDragOver, 'has-image': hasImage }"
        @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">

        <!-- 有图片时显示图片 -->
        <template v-if="hasImage">
            <img :src="currentImageSrc" :alt="alt" :style="imageStyle" @error="handleImageError" class="brick-image" />
        </template>

        <!-- 无图片时显示占位区域 -->
        <template v-else>
            <div class="placeholder">
                <div class="placeholder-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                    </svg>
                </div>
                <div class="placeholder-text">
                    <p class="main-text">拖入图片或点击上传</p>
                    <p class="sub-text">支持 JPG、PNG、SVG 格式</p>
                </div>
                <input ref="fileInput" type="file" accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
                    class="file-input" @change="handleFileSelect" />
            </div>
        </template>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
    // 图片来源 - 可以是 URL 或 base64
    src: {
        type: String,
        default: ''
    },
    // 备用文本
    alt: {
        type: String,
        default: '图片'
    },
    // 对象适配模式
    objectFit: {
        type: String,
        default: 'contain',
        validator: (value) => ['fill', 'contain', 'cover', 'none', 'scale-down'].includes(value)
    },
    // 对象位置
    objectPosition: {
        type: String,
        default: 'center'
    },
    // 边框圆角
    borderRadius: {
        type: [String, Number],
        default: 0
    },
    // 背景颜色（用于透明图片）
    backgroundColor: {
        type: String,
        default: 'transparent'
    },
    // 是否启用阴影
    shadow: {
        type: Boolean,
        default: false
    },
    // API 配置（可选，用于从后端获取图片）
    apiConfig: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:src', 'image-loaded', 'image-error'])

// 内部状态
const isDragOver = ref(false)
const imageError = ref(false)
const internalSrc = ref('')
const fileInput = ref(null)

// 计算当前图片源
const currentImageSrc = computed(() => {
    return internalSrc.value || props.src
})

// 是否有图片
const hasImage = computed(() => {
    return !!currentImageSrc.value && !imageError.value
})

// 图片样式
const imageStyle = computed(() => {
    const radius = typeof props.borderRadius === 'number'
        ? `${props.borderRadius}px`
        : props.borderRadius

    return {
        objectFit: props.objectFit,
        objectPosition: props.objectPosition,
        borderRadius: radius
    }
})

// 监听 src 变化，重置错误状态
watch(() => props.src, (newSrc) => {
    if (newSrc) {
        imageError.value = false
        internalSrc.value = ''
    }
})

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
    }

    // 处理拖入的 URL（从浏览器中拖入图片）
    const url = event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain')
    if (url && isValidImageUrl(url)) {
        setImageSource(url)
    }
}

// 处理文件选择
const handleFileSelect = (event) => {
    const files = event.target.files
    if (files.length > 0) {
        processFile(files[0])
    }
    // 清空 input 以便可以重复选择相同文件
    event.target.value = ''
}

// 处理文件
const processFile = (file) => {
    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
        console.warn('不支持的图片格式:', file.type)
        return
    }

    // 使用 FileReader 读取文件
    const reader = new FileReader()
    reader.onload = (e) => {
        const base64 = e.target.result
        setImageSource(base64)
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

// 设置图片源
const setImageSource = (src) => {
    internalSrc.value = src
    imageError.value = false
    emit('update:src', src)
}

// 处理图片加载错误
const handleImageError = () => {
    imageError.value = true
    emit('image-error')
}
</script>

<style scoped>
.img-brick {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background: v-bind(backgroundColor);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.img-brick.has-image {
    box-shadow: v-bind('shadow ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none"');
}

.img-brick.drag-over {
    border: 2px dashed #409eff;
    background: rgba(64, 158, 255, 0.1);
}

.brick-image {
    width: 100%;
    height: 100%;
    display: block;
    transition: transform 0.3s ease;
}

.placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
    border: 2px dashed #d0d0d0;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
}

.placeholder:hover {
    border-color: #409eff;
    background: linear-gradient(135deg, #e8f4ff 0%, #d6ebff 100%);
}

.placeholder:hover .placeholder-icon {
    color: #409eff;
    transform: scale(1.1);
}

.placeholder-icon {
    color: #999;
    margin-bottom: 12px;
    transition: all 0.3s ease;
}

.placeholder-text {
    text-align: center;
}

.placeholder-text .main-text {
    font-size: 14px;
    color: #666;
    margin: 0 0 4px 0;
    font-weight: 500;
}

.placeholder-text .sub-text {
    font-size: 12px;
    color: #999;
    margin: 0;
}

.file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
}

/* 主题适配 */
:deep(.dark-theme) .placeholder,
.img-brick[data-theme="dark"] .placeholder {
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    border-color: #444;
}

:deep(.dark-theme) .placeholder:hover,
.img-brick[data-theme="dark"] .placeholder:hover {
    border-color: #409eff;
    background: linear-gradient(135deg, #1a3a5c 0%, #0d2b47 100%);
}

:deep(.dark-theme) .placeholder-text .main-text,
.img-brick[data-theme="dark"] .placeholder-text .main-text {
    color: #ccc;
}

:deep(.dark-theme) .placeholder-text .sub-text,
.img-brick[data-theme="dark"] .placeholder-text .sub-text {
    color: #888;
}

:deep(.tech-theme) .placeholder,
.img-brick[data-theme="tech"] .placeholder {
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 150, 200, 0.1) 100%);
    border-color: rgba(0, 212, 255, 0.3);
}

:deep(.tech-theme) .placeholder:hover,
.img-brick[data-theme="tech"] .placeholder:hover {
    border-color: #00d4ff;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 150, 200, 0.2) 100%);
}

:deep(.tech-theme) .placeholder-icon,
.img-brick[data-theme="tech"] .placeholder-icon {
    color: #00d4ff;
}

:deep(.tech-theme) .placeholder-text .main-text,
.img-brick[data-theme="tech"] .placeholder-text .main-text {
    color: #00d4ff;
}

:deep(.tech-theme) .placeholder-text .sub-text,
.img-brick[data-theme="tech"] .placeholder-text .sub-text {
    color: rgba(0, 212, 255, 0.7);
}
</style>
