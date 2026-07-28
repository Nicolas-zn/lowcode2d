/**
 * ActionEngine - 动作执行器
 * 职责：执行动作，动作链编排，上下文传递
 */

import type { ActionConfig, ActionContext, IAction } from './types'
import { TemplateEngine } from '../utils/template'

export class ActionEngine {
  private actions: Map<string, IAction> = new Map()

  /**
   * 注册动作
   */
  registerAction(type: string, action: IAction): void {
    this.actions.set(type, action)
  }

  /**
   * 执行动作链
   */
  async executeActions(
    configs: ActionConfig[],
    context: ActionContext
  ): Promise<void> {
    for (const config of configs) {
      await this.executeAction(config, context)
    }
  }

  /**
   * 执行单个动作
   */
  private async executeAction(
    config: ActionConfig,
    context: ActionContext
  ): Promise<void> {
    const action = this.actions.get(config.type)
    if (!action) {
      console.warn(`未找到动作类型: ${config.type}`)
      return
    }

    // 解析参数中的模板
    const resolvedParams = this.resolveParams(config.params, context)

    await action.execute(resolvedParams, context)
  }

  /**
   * 解析参数模板
   */
  private resolveParams(
    params: Record<string, any>,
    context: ActionContext
  ): Record<string, any> {
    const resolved: Record<string, any> = {}
    const data = {
      ...context.event.pickResult?.properties,
      ...context.data
    }

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        resolved[key] = TemplateEngine.parse(value, data)
      } else {
        resolved[key] = value
      }
    }

    return resolved
  }
}
