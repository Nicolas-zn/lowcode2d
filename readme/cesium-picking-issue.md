# Cesium 坐标拾取偏移问题 (Viewport Scalar Tearing)

## 1. 现象描述
在包含外部容器缩放逻辑的 Web 应用中（例如低代码平台编辑器画布普遍使用了 `transform: scale()` 进行了响应式缩放），Cesium 地图场景内部的模型实体会出现“点击和悬浮拾取错位”的现象。

具体表现为：
- 视觉与判定不同步：点击模型（如 Cube）其实际命中区不仅有向右平移的现象，还伴随错位。常常是点左方无效，要点击虚空的右方反而能选中。
- 越偏越甚：拾取偏差随着元素与 WebGL 画布原点（通常为左上角）的距离增长而变得更加严重。

## 2. 根本原因 (Root Cause)
由于 Cesium 的场景拾取系统 (`viewer.scene.pick`) 实质上是交由底层的 WebGL 读取一个隐藏的选框渲染缓冲层帧（Pick Buffer）进行像素级的射线比对。该缓冲区是在初始化时被尺寸常量 (`canvas.clientWidth/clientHeight`) 所固定锁死的。

出问题的关键链路是：
1. 本低代码业务场景的 `CanvasPanel` 在使用期间施加了 CSS `:style="{ transform: scale() }"` 强制缩放动作。
2. 内部 Cesium 的 `ScreenSpaceEventHandler` 从外层容器事件提取到的事件捕捉坐标是在被缩放降维的 `getBoundingClientRect()` 层面的。
3. WebGL 本身并无感知，仍期待收到一个真实物理尺度（`clientWidth` 倍率）的传入参数。由此形成了极端的 **“视口标量坐标撕裂”**。

## 3. 彻底解决方案

问题的核心破局点是利用**动态反向补偿算法**。我们将外层因 CSS 引起的变动率，在交付给底层的 `pick` 获取阶段人工给矫正回来。

### 代码修复文件：
`apps/lowcode2D/src/cesium-interaction/core/PickManager.ts`

### 核心补偿算法逻辑：
```typescript
pick(rawScreenPos: { x: number; y: number }): PickResult | null {
  // 1. 获取目标 Cesium 画布元素
  const canvas = this.viewer.canvas
  
  // 2. 捕获此时被 CSS 缩放后的最终包围盒边界
  const rect = canvas.getBoundingClientRect()
  
  // 3. 反算出本来的客户端尺寸与此时 CSS 拉伸尺寸的差距补偿率
  const scaleX = canvas.clientWidth / rect.width
  const scaleY = canvas.clientHeight / rect.height

  // 4. 对屏幕获取的坐标予以缩减补偿运算，使之升维回 WebGL 的真实虚拟尺度空间内
  const screenPosition = {
    x: rawScreenPos.x * scaleX,
    y: rawScreenPos.y * scaleY
  }

  // 5. 传入精准的算法矫正坐标，Cesium 判定命中率从而达到 100% 的同步修复
  const pickedObject = this.viewer.scene.pick(
    new Cesium.Cartesian2(screenPosition.x, screenPosition.y)
  )

  if (!pickedObject) {
    return null
  }

  return this.parsePickedObject(pickedObject, screenPosition)
}
```

## 4. 防范事项
1. **千万避免强制干扰渲染器 DOM 缩放**：避免全局通过强 CSS 选择器书写 `.cesium-widget canvas { width: 100% !important; height: 100% !important; }`，这会阻断 `clientWidth` 自主渲染的能力，致使算法补偿因子错乱。
2. **Mac 端 Retina 飞升屏调优**：初始化时屏蔽官方原生的估算，强行上锁绑定物理设备：`useBrowserRecommendedResolution: false` + `viewer.resolutionScale = window.devicePixelRatio || 1`。
