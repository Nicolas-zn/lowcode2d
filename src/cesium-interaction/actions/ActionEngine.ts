/**
 * ActionEngine - 动作执行引擎
 * 支持插件化扩展
 */

import type { IAction, ActionContext } from './types'

export class ActionEngine {
  private actions: Map<string, IAction> = new Map()

  /**
   * 注册动作
   */
  register(name: string, action: IAction): void {
    this.actions.set(name, action)
  }

  /**
   * 执行动作列表
   */
  async runActions(actions: Array<string | { name: string; params?: Record<string, any> }>, context: ActionContext): Promise<void> {
    for (const actionConfig of actions) {
      const name = typeof actionConfig === 'string' ? actionConfig : actionConfig.name
      const params = typeof actionConfig === 'object' ? actionConfig.params : undefined

      const action = this.actions.get(name)
      if (action) {
        await action.execute({ ...context, params })
      } else {
        console.warn(`动作未注册: ${name}`)
      }
    }
  }
}
