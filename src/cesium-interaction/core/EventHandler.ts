/**
 * EventHandler - Cesium 事件处理器
 * 职责：监听 Cesium 鼠标事件，触发自定义事件
 */

import * as Cesium from 'cesium'
import type { InteractionEvent, EventListener } from '../event/types'
import { InteractionEventType } from '../event/types'
import { PickManager } from './PickManager'
import { CesiumEventBridge } from '../bridge/CesiumEventBridge'

export class EventHandler {
  private viewer: Cesium.Viewer
  private pickManager: PickManager
  private handler: Cesium.ScreenSpaceEventHandler
  private listeners: Map<InteractionEventType, Set<EventListener>>
  private lastHoveredId: string | null = null
  private bridge: CesiumEventBridge

  constructor(viewer: Cesium.Viewer, pickManager: PickManager) {
    this.viewer = viewer
    this.pickManager = pickManager
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    this.listeners = new Map()
    this.bridge = new CesiumEventBridge()
    this.initEventListeners()
  }

  /**
   * 初始化 Cesium 事件监听
   */
  private initEventListeners(): void {
    // Click 事件
    this.handler.setInputAction((movement: any) => {
      this.handleClick(movement.position)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // Hover 事件
    this.handler.setInputAction((movement: any) => {
      this.handleHover(movement.endPosition)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }

  /**
   * 处理点击事件
   */
  private handleClick(position: Cesium.Cartesian2): void {
    console.log('handleClick 被调用')
    const pickResult = this.pickManager.pick({
      x: position.x,
      y: position.y
    })

    const event: InteractionEvent = {
      type: InteractionEventType.CLICK,
      pickResult,
      screenPosition: { x: position.x, y: position.y },
      timestamp: Date.now()
    }

    this.emit(InteractionEventType.CLICK, event)
  }

  /**
   * 处理悬停事件
   */
  private handleHover(position: Cesium.Cartesian2): void {
    const pickResult = this.pickManager.pick({
      x: position.x,
      y: position.y
    })

    const currentId = pickResult?.id || null

    // 更新鼠标样式
    if (currentId) {
      this.viewer.canvas.style.cursor = 'pointer'
    } else {
      this.viewer.canvas.style.cursor = 'default'
    }

    // 触发 hover_end
    if (this.lastHoveredId && this.lastHoveredId !== currentId) {
      const endEvent: InteractionEvent = {
        type: InteractionEventType.HOVER_END,
        pickResult: null,
        screenPosition: { x: position.x, y: position.y },
        timestamp: Date.now()
      }
      this.emit(InteractionEventType.HOVER_END, endEvent)
    }

    // 触发 hover
    if (currentId) {
      const event: InteractionEvent = {
        type: InteractionEventType.HOVER,
        pickResult,
        screenPosition: { x: position.x, y: position.y },
        timestamp: Date.now()
      }
      this.emit(InteractionEventType.HOVER, event)
    }

    this.lastHoveredId = currentId
  }

  /**
   * 注册事件监听器
   */
  on(type: InteractionEventType, listener: EventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)
  }

  /**
   * 移除事件监听器
   */
  off(type: InteractionEventType, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener)
  }

  /**
   * 触发事件
   */
  private emit(type: InteractionEventType, event: InteractionEvent): void {
    // 触发本地监听器
    this.listeners.get(type)?.forEach((listener) => listener(event))
    // 桥接到全局总线
    this.bridge.bridge(event)
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.handler.destroy()
    this.listeners.clear()
  }
}
