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
                <i class="bi bi-camera-video"></i>
                <span>请配置 m3u8 视频地址</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Hls from 'hls.js'

const props = defineProps({
    title: { type: String, default: 'm3u8播放器' },
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
let hls = null
let playPromise = null

const HLS_CONFIG = {
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 30,
    maxBufferLength: 20,
    maxMaxBufferLength: 30,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: 10,
    startFragPrefetch: true,
    capLevelToPlayerSize: true,
    testBandwidth: true,
    manifestLoadingTimeOut: 10_000,
    levelLoadingTimeOut: 10_000,
    fragLoadingTimeOut: 20_000
}

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
    if (hls) {
        hls.destroy()
        hls = null
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

    if (Hls.isSupported()) {
        hls = new Hls(HLS_CONFIG)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => tryPlay(video))
        hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
            const details = data?.details
            if (details?.live && typeof hls?.latency === 'number' && hls.latency > 8) {
                const syncPosition = hls.liveSyncPosition
                if (Number.isFinite(syncPosition) && Number.isFinite(video.duration) && syncPosition < video.duration) {
                    video.currentTime = syncPosition
                }
            }
        })
        hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad()
                return
            }
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError()
                return
            }
            errorText.value = '播放失败，请检查 m3u8 地址或网络'
            destroyPlayer()
        })
        hls.loadSource(props.src)
        return
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = props.src
        video.addEventListener('loadedmetadata', () => tryPlay(video), { once: true })
        return
    }

    errorText.value = '当前浏览器不支持 HLS 播放'
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
