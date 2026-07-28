/**
 * FlyToAction - 飞行到对象
 */

import type { IAction, ActionContext } from '../types'
import * as Cesium from 'cesium'

export class FlyToAction implements IAction {
  private viewer: Cesium.Viewer

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  execute(context: ActionContext): void {
    const { object, params } = context
    const duration = params?.duration || 1.5
    const offset = params?.offset || 500

    if (object.type === 'entity' && object.raw?.id) {
      this.viewer.flyTo(object.raw.id, {
        duration,
        offset: new Cesium.HeadingPitchRange(0, -45, offset)
      })
    } else if (object.position) {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromCartesian(object.position),
        duration
      })
    }
  }
}
