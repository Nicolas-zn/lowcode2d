<template>
    <div class="video-brick">
        <div v-if="title" class="video-title">{{ title }}</div>
        <div class="video-shell">
            <div v-if="errorText" class="error-banner">{{ errorText }}</div>
            <video
                ref="videoRef"
                class="video-element"
                :controls="controls"
                :muted="muted"
                :loop="loop"
                playsinline
                preload="auto"
                :style="{ objectFit }"
            />
            <div v-if="!src" class="video-placeholder">
                <i class="bi bi-camera-reels"></i>
                <span>请配置 flv 视频地址</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import flvjs from 'flv.js'

const props = defineProps({
    title: { type: String, default: 'flv播放器' },
    src: { type: String, default: '' },
    controls: { type: Boolean, default: true },
    autoplay: { type: Boolean, default: true },
    muted: { type: Boolean, default: true },
    loop: { type: Boolean, default: false },
    objectFit: {
        type: String,
        default: 'contain',
        validator: value => ['fill', 'contain', 'cover', 'none', 'scale-down'].includes(value)
    }
})

const videoRef = ref(null)
const errorText = ref('')
let player = null
let playPromise = null

const tryPlay = async (video) => {
    if (!props.autoplay || !video || playPromise) return
    try {
        playPromise = video.play()
        await playPromise
    } catch {
        // Browser autoplay policy can block playback; controls remain available.
    } finally {
        playPromise = null
    }
}

const destroyPlayer = () => {
    if (player) {
        player.pause()
        player.unload()
        player.detachMediaElement()
        player.destroy()
        player = null
    }
    playPromise = null
    const video = videoRef.value
    if (video) {
        video.pause()
        video.removeAttribute('src')
        video.load()
    }
    errorText.value = ''
}

const setupPlayer = async () => {
    await nextTick()
    const video = videoRef.value
    if (!video || !props.src) {
        destroyPlayer()
        return
    }

    destroyPlayer()
    errorText.value = ''

    if (!flvjs.isSupported()) {
        errorText.value = '当前浏览器不支持 FLV 播放'
        return
    }

    player = flvjs.createPlayer(
        {
            type: 'flv',
            url: props.src,
            isLive: true,
            hasAudio: true,
            hasVideo: true
        },
        {
            enableWorker: true,
            enableStashBuffer: false,
            stashInitialSize: 128,
            lazyLoad: false,
            autoCleanupSourceBuffer: true,
            autoCleanupMaxBackwardDuration: 30,
            autoCleanupMinBackwardDuration: 10
        }
    )

    player.attachMediaElement(video)
    player.on(flvjs.Events.ERROR, () => {
        errorText.value = '播放失败，请检查 flv 地址或网络'
    })
    player.load()
    tryPlay(video)
}

watch(
    () => [props.src, props.autoplay, props.muted, props.loop],
    () => setupPlayer(),
    { immediate: true }
)

onBeforeUnmount(() => {
    destroyPlayer()
})
</script>

<style scoped>
.video-brick {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #0f172a;
    border-radius: 6px;
}

.video-title {
    flex: 0 0 auto;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 600;
    color: #67e8f9;
    background: rgba(15, 23, 42, 0.92);
    border-bottom: 1px solid rgba(103, 232, 249, 0.22);
}

.video-shell {
    position: relative;
    flex: 1;
    min-height: 0;
    background: #020617;
}

.video-element {
    display: block;
    width: 100%;
    height: 100%;
    background: #000;
}

.video-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: rgba(226, 232, 240, 0.72);
    background:
        linear-gradient(135deg, rgba(20, 184, 166, 0.14), transparent 45%),
        #020617;
    font-size: 13px;
}

.video-placeholder i {
    font-size: 34px;
    color: #22d3ee;
}

.error-banner {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2;
    padding: 8px 10px;
    font-size: 12px;
    color: #fecaca;
    background: rgba(127, 29, 29, 0.88);
    border-bottom: 1px solid rgba(248, 113, 113, 0.5);
}
</style>
