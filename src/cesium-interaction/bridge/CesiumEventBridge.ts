/**
 * Cesium 事件桥接器
 * 将 Cesium 交互事件桥接到全局事件总线
 */

import { globalEventBus } from '@/core/GlobalEventBus'
import type { InteractionEvent } from '../event/types'

export class CesiumEventBridge {
  private prefix = 'cesium'

  // 桥接事件到全局总线
  bridge(event: InteractionEvent): void {
    const globalEvent = `${this.prefix}:${event.type}`
    globalEventBus.emit(globalEvent, {
      source: 'cesium',
      ...event
    })
  }

  // 订阅全局事件
  subscribe(eventType: string, callback: (data: any) => void): void {
    globalEventBus.on(`${this.prefix}:${eventType}`, callback)
  }

  // 取消订阅
  unsubscribe(eventType: string, callback: (data: any) => void): void {
    globalEventBus.off(`${this.prefix}:${eventType}`, callback)
  }
}
