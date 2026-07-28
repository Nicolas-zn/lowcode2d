/**
 * 自定义动作示例
 */

import type { IAction, ActionContext } from '../actions/types'

// 自定义动作：飞到对象
export class FlyToAction implements IAction {
  private viewer: any

  constructor(viewer: any) {
    this.viewer = viewer
  }

  execute(context: ActionContext): void {
    const { object } = context
    if (object.position) {
      this.viewer.camera.flyTo({
        destination: object.position,
        duration: 2
      })
    }
  }
}

// 使用方式
// actionEngine.register('flyTo', new FlyToAction(viewer))
