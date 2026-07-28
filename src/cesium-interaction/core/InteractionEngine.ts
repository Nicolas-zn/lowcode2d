/**
 * InteractionEngine - 交互引擎核心
 * 职责：初始化交互系统，协调各模块工作
 */

import * as Cesium from 'cesium'
import { PickManager } from './PickManager'
import { EventHandler } from './EventHandler'
import type { InteractionEvent, EventListener } from '../event/types'
import { InteractionEventType } from '../event/types'

export class InteractionEngine {
  private viewer: Cesium.Viewer
  private pickManager: PickManager
  private eventHandler: EventHandler
  private enabled: boolean = true

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
    this.pickManager = new PickManager(viewer)
    this.eventHandler = new EventHandler(viewer, this.pickManager)
  }

  /**
   * 监听交互事件
   */
  on(type: InteractionEventType, listener: EventListener): void {
    this.eventHandler.on(type, listener)
  }

  /**
   * 移除事件监听
   */
  off(type: InteractionEventType, listener: EventListener): void {
    this.eventHandler.off(type, listener)
  }

  /**
   * 启用交互
   */
  enable(): void {
    this.enabled = true
  }

  /**
   * 禁用交互
   */
  disable(): void {
    this.enabled = false
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.eventHandler.destroy()
  }
}
