/**
 * 事件类型定义
 */

import type * as Cesium from 'cesium'

// 交互事件类型
export enum InteractionEventType {
  CLICK = 'click',
  HOVER = 'hover',
  HOVER_END = 'hoverEnd',
  DRAG_START = 'dragStart',
  DRAG_MOVE = 'dragMove',
  DRAG_END = 'dragEnd'
}

// 拾取对象类型
export enum PickObjectType {
  ENTITY = 'entity',
  PRIMITIVE = 'primitive',
  TILESET = '3dtiles',
  IMAGERY = 'imagery',
  TERRAIN = 'terrain',
  UNKNOWN = 'unknown'
}

// 拾取结果
export interface PickResult {
  type: PickObjectType
  id: string | null
  name: string | null
  object: any
  position: Cesium.Cartesian3 | null
  cartographic: Cesium.Cartographic | null
  properties: Record<string, any>
}

// 交互事件数据
export interface InteractionEvent {
  type: InteractionEventType
  pickResult: PickResult | null
  screenPosition: { x: number; y: number }
  timestamp: number
}

// 事件监听器
export type EventListener = (event: InteractionEvent) => void
