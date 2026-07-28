/**
 * HighlightAction - 高亮动作
 */

import type { IAction, ActionContext } from '../types'
import * as Cesium from 'cesium'

export class HighlightAction implements IAction {
  private viewer: Cesium.Viewer
  private highlightedEntity: Cesium.Entity | null = null

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  async execute(params: Record<string, any>, context: ActionContext): Promise<void> {
    const { color = '#ffff00' } = params
    const pickResult = context.event.pickResult

    // 清除之前的高亮
    this.clearHighlight()

    if (!pickResult || pickResult.type !== 'entity') return

    const entity = pickResult.object.id as Cesium.Entity
    if (!entity) return

    // 保存原始颜色并设置高亮
    this.highlightedEntity = entity

    // 简单高亮实现
    if (entity.billboard) {
      entity.billboard.color = Cesium.Color.fromCssColorString(color)
    }
    if (entity.point) {
      entity.point.color = Cesium.Color.fromCssColorString(color)
    }
  }

  clearHighlight(): void {
    if (this.highlightedEntity) {
      // 恢复原始颜色
      this.highlightedEntity = null
    }
  }
}
