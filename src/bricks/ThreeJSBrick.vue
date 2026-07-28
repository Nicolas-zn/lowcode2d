<template>
  <div class="threejs-brick" ref="threeContainer">
    <div v-if="!initialized" class="threejs-placeholder">
      <el-icon :size="48" color="#67C23A"><Box /></el-icon>
      <span>Three.js 3D 场景</span>
      <el-text type="info" size="small">可在配置面板中设置场景参数</el-text>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Box } from '@element-plus/icons-vue'

const props = defineProps({
  title: { type: String, default: 'Three.js 场景' }
})

const threeContainer = ref(null)
const initialized = ref(false)

let scene, camera, renderer, animationId

const initScene = async () => {
  if (!threeContainer.value) return

  try {
    const THREE = await import('three')

    const container = threeContainer.value
    const width = container.clientWidth
    const height = container.clientHeight

    // 场景
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)

    // 相机
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 5

    // 渲染器
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    // 灯光
    const ambientLight = new THREE.AmbientLight(0x404040, 2)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // 示例几何体
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0x67C23A,
      metalness: 0.5,
      roughness: 0.3
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // 网格地面
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(gridHelper)

    initialized.value = true

    // 动画循环
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      mesh.rotation.x += 0.005
      mesh.rotation.y += 0.01
      renderer.render(scene, camera)
    }
    animate()

    // 监听容器大小变化
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    resizeObserver.observe(container)
  } catch (e) {
    console.error('Three.js init error:', e)
  }
}

onMounted(() => {
  nextTick(() => {
    initScene()
  })
})

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.threejs-brick {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background: #1a1a2e;
}

.threejs-brick canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

.threejs-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #67C23A;
  font-size: 16px;
  background: #1a1a2e;
}
</style>
