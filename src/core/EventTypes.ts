/**
 * 全局事件类型定义
 */

// Cesium 事件
export enum CesiumEventType {
  CLICK = 'cesium:click',
  HOVER = 'cesium:hover',
  HOVER_END = 'cesium:hoverEnd'
}

// 其他子系统事件可以在这里扩展
export enum CanvasEventType {
  ELEMENT_SELECTED = 'canvas:elementSelected',
  ELEMENT_MOVED = 'canvas:elementMoved'
}

// 全局事件
export enum GlobalEventType {
  SYSTEM_READY = 'global:systemReady',
  ERROR = 'global:error'
}
