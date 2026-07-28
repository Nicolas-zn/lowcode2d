/**
 * PickManager - Cesium 拾取管理器
 * 职责：封装 Cesium 拾取逻辑，统一拾取结果格式
 */

import * as Cesium from 'cesium'
import type { PickResult, PickObjectType } from '../event/types'
import { PickObjectType as POT } from '../event/types'

export class PickManager {
  private viewer: Cesium.Viewer

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  pick(rawScreenPos: { x: number; y: number }): PickResult | null {
    // 【核心修复】计算CSS缩放导致的高纬度坐标漂移
    // 因为在大屏编辑器(CanvasPanel)被强加了 transform: scale() 控制缩放，
    // 导致传入的坐标基于 rect(缩放后)，而 Cesium 底层 Pick 基于 Client(真实)，必须计算反相补偿才能对齐！
    const canvas = this.viewer.canvas
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.clientWidth / rect.width
    const scaleY = canvas.clientHeight / rect.height

    const screenPosition = {
      x: rawScreenPos.x * scaleX,
      y: rawScreenPos.y * scaleY
    }

    const pickedObject = this.viewer.scene.pick(
      new Cesium.Cartesian2(screenPosition.x, screenPosition.y)
    )

    if (!pickedObject) {
      return null
    }

    return this.parsePickedObject(pickedObject, screenPosition)
  }

  /**
   * 解析拾取对象
   */
  private parsePickedObject(
    pickedObject: any,
    screenPosition: { x: number; y: number }
  ): PickResult {
    const type = this.getObjectType(pickedObject)
    const position = this.getWorldPosition(screenPosition)
    const cartographic = position
      ? Cesium.Cartographic.fromCartesian(position)
      : null

    return {
      type,
      id: this.getObjectId(pickedObject, type),
      object: pickedObject,
      position,
      cartographic,
      properties: this.getObjectProperties(pickedObject, type),
      name: this.getObjectName(pickedObject, type)
    }
  }

  /**
   * 获取对象类型
   */
  private getObjectType(pickedObject: any): PickObjectType {
    if (pickedObject.id && pickedObject.id instanceof Cesium.Entity) {
      return POT.ENTITY
    }
    if (pickedObject.primitive) {
      if (pickedObject.primitive instanceof Cesium.Cesium3DTileset) {
        return POT.TILESET
      }
      return POT.PRIMITIVE
    }
    if (pickedObject.imageryLayer) {
      return POT.IMAGERY
    }
    return POT.UNKNOWN
  }

  /**
   * 获取对象ID
   */
  private getObjectId(pickedObject: any, type: PickObjectType): string | null {
    switch (type) {
      case POT.ENTITY:
        return pickedObject.id?.id || null
      case POT.TILESET:
        return pickedObject.primitive?.url || null
      case POT.PRIMITIVE:
        return pickedObject.primitive?.id || null
      default:
        return null
    }
  }

  /**
   * 获取对象属性
   */
  private getObjectProperties(
    pickedObject: any,
    type: PickObjectType
  ): Record<string, any> {
    const props: Record<string, any> = {}

    switch (type) {
      case POT.ENTITY:
        const entity = pickedObject.id as Cesium.Entity
        if (entity.properties) {
          const propertyNames = entity.properties.propertyNames
          propertyNames.forEach((name: string) => {
            props[name] = entity.properties[name]?.getValue(
              Cesium.JulianDate.now()
            )
          })
        }
        props.name = entity.name
        break

      case POT.TILESET:
        const feature = pickedObject
        if (feature.getPropertyIds) {
          feature.getPropertyIds().forEach((id: string) => {
            props[id] = feature.getProperty(id)
          })
        }
        break
    }

    return props
  }

  /**
   * 获取世界坐标
   */
  private getWorldPosition(screenPosition: {
    x: number
    y: number
  }): Cesium.Cartesian3 | null {
    const ray = this.viewer.camera.getPickRay(
      new Cesium.Cartesian2(screenPosition.x, screenPosition.y)
    )
    if (!ray) return null

    return this.viewer.scene.globe.pick(ray, this.viewer.scene)
  }

  /**
   * 获取对象名称
   */
  private getObjectName(pickedObject: any, type: PickObjectType): string | null {
    if (type === POT.ENTITY && pickedObject.id) {
      return pickedObject.id.name || null
    }
    return null
  }
}
