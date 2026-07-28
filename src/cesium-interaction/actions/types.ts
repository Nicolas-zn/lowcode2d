/**
 * Action 类型定义
 */

import type { PickedObject } from '../core/types'

export interface ActionContext {
  object: PickedObject
  event: string
  data?: Record<string, any>
  params?: Record<string, any>
}

export interface IAction {
  execute(context: ActionContext): Promise<void> | void
}
