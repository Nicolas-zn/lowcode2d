/**
 * ChangeColorAction - 改变对象颜色
 */

import type { IAction, ActionContext } from '../types'
import * as Cesium from 'cesium'

export class ChangeColorAction implements IAction {
  execute(context: ActionContext): void {
    const { object, params } = context
    const color = params?.color || '#FFFF00'
    const alpha = params?.alpha ?? 0.8

    if (object.type === 'entity' && object.raw?.id) {
      const entity = object.raw.id as Cesium.Entity
      const cesiumColor = Cesium.Color.fromCssColorString(color).withAlpha(alpha)

      if (entity.box) {
        entity.box.material = cesiumColor
      } else if (entity.ellipse) {
        entity.ellipse.material = cesiumColor
      } else if (entity.ellipsoid) {
        entity.ellipsoid.material = cesiumColor
      } else if (entity.polygon) {
        entity.polygon.material = cesiumColor
      }
    }
  }
}
