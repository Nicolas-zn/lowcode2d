/**
 * HighlightAction - 高亮动作
 */

import type { IAction, ActionContext } from '../types'
import * as Cesium from 'cesium'

export class HighlightAction implements IAction {
  private viewer: Cesium.Viewer

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  execute(context: ActionContext): void {
    const { object } = context

    if (object.type === 'entity' && object.raw?.id) {
      const entity = object.raw.id as Cesium.Entity

      // 简单高亮实现
      if (entity.point) {
        entity.point.color = Cesium.Color.YELLOW
        entity.point.pixelSize = new Cesium.ConstantProperty(25)
      }

      console.log('高亮对象:', object.id)
    }
  }
}
