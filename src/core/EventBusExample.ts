/**
 * 全局事件总线使用示例
 */

import { globalEventBus } from '@/core/GlobalEventBus'
import { CesiumEventType } from '@/core/EventTypes'

// 1. 订阅 Cesium 点击事件
globalEventBus.on(CesiumEventType.CLICK, (data) => {
  console.log('全局监听到 Cesium 点击:', data)
})

// 2. 获取 Cesium 子系统
const cesiumSystem = globalEventBus.getSubsystem('cesium')

// 3. 跨子系统通信
globalEventBus.on('canvas:elementSelected', (data) => {
  // Canvas 选中元素时，可以触发 Cesium 飞行
  globalEventBus.emit('cesium:flyTo', { target: data.id })
})
