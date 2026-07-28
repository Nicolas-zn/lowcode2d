/**
 * InteractionEngine - 交互引擎
 * 封装 Cesium.ScreenSpaceEventHandler，支持 click/hover
 */

import * as Cesium from 'cesium'
import { EventBus } from '../event/EventBus'
import type { PickedObject } from './types'

export class InteractionEngine {
  private viewer: Cesium.Viewer
  private handler: Cesium.ScreenSpaceEventHandler
  private eventBus: EventBus
  private lastHoveredId: string | null = null

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    this.eventBus = new EventBus()
    this.init()
  }

  private init(): void {
    // Click 事件
    this.handler.setInputAction((movement: any) => {
      const obj = this.pickObject(movement.position)
      this.eventBus.emit('click', obj)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // Hover 事件
    this.handler.setInputAction((movement: any) => {
      const obj = this.pickObject(movement.endPosition)
      const currentId = obj?.id || null

      if (currentId !== this.lastHoveredId) {
        if (this.lastHoveredId) {
          this.eventBus.emit('hoverEnd', { id: this.lastHoveredId })
        }
        if (currentId) {
          this.eventBus.emit('hover', obj)
        }
        this.lastHoveredId = currentId
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }

  /**
   * 统一拾取方法
   */
  private pickObject(position: Cesium.Cartesian2): PickedObject | null {
    // 使用 drillPick 获取所有拾取对象，取第一个
    const pickedObjects = this.viewer.scene.drillPick(position, 1)
    if (!pickedObjects || pickedObjects.length === 0) return null

    const picked = pickedObjects[0]

    const obj: PickedObject = {
      id: null,
      name: null,
      type: 'unknown',
      position: this.getWorldPosition(position),
      raw: picked
    }

    // Entity
    if (picked.id && picked.id instanceof Cesium.Entity) {
      obj.type = 'entity'
      obj.id = picked.id.id
      obj.name = picked.id.name || null
      return obj
    }

    // 3D Tiles
    if (picked.primitive instanceof Cesium.Cesium3DTileset) {
      obj.type = '3dtiles'
      obj.id = picked.primitive.url || null
      return obj
    }

    // Primitive
    if (picked.primitive) {
      obj.type = 'primitive'
      obj.id = picked.primitive.id || null
      return obj
    }

    return obj
  }

  /**
   * 获取世界坐标
   */
  private getWorldPosition(position: Cesium.Cartesian2): Cesium.Cartesian3 | null {
    const ray = this.viewer.camera.getPickRay(position)
    if (!ray) return null
    return this.viewer.scene.globe.pick(ray, this.viewer.scene)
  }

  /**
   * 监听事件
   */
  on(event: string, callback: (data: any) => void): void {
    this.eventBus.on(event, callback)
  }

  /**
   * 移除监听
   */
  off(event: string, callback: (data: any) => void): void {
    this.eventBus.off(event, callback)
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.handler.destroy()
    this.eventBus.clear()
  }
}
