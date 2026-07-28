/**
 * PopupAction - 弹窗动作
 */

import type { IAction, ActionContext } from '../types'

export class PopupAction implements IAction {
  private popupCallback?: (content: string, position: { x: number; y: number }) => void

  constructor(callback?: (content: string, position: { x: number; y: number }) => void) {
    this.popupCallback = callback
  }

  async execute(params: Record<string, any>, context: ActionContext): Promise<void> {
    const { title, content } = params
    const position = context.event.screenPosition

    const html = `
      <div class="cesium-popup">
        <h3>${title || '详情'}</h3>
        <div>${content || ''}</div>
      </div>
    `

    if (this.popupCallback) {
      this.popupCallback(html, position)
    }
  }
}
