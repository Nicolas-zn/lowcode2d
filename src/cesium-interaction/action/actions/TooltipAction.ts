/**
 * TooltipAction - 提示动作
 */

import type { IAction, ActionContext } from '../types'

export class TooltipAction implements IAction {
  private tooltipCallback?: (content: string, position: { x: number; y: number }) => void

  constructor(callback?: (content: string, position: { x: number; y: number }) => void) {
    this.tooltipCallback = callback
  }

  async execute(params: Record<string, any>, context: ActionContext): Promise<void> {
    const { content } = params
    const position = context.event.screenPosition

    if (this.tooltipCallback) {
      this.tooltipCallback(content || '', position)
    }
  }
}
