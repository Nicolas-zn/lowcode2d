/**
 * 动作类型定义
 */

import type { InteractionEvent } from '../event/types'

// 动作上下文
export interface ActionContext {
  event: InteractionEvent
  data: Record<string, any>
}

// 动作执行器接口
export interface IAction {
  execute(params: Record<string, any>, context: ActionContext): Promise<void>
}

// 动作类型枚举
export enum ActionType {
  POPUP = 'popup',
  TOOLTIP = 'tooltip',
  HIGHLIGHT = 'highlight',
  REQUEST = 'request'
}
