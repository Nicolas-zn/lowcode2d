/**
 * 规则类型定义
 */

import type { InteractionEventType, PickObjectType } from '../event/types'

// 规则条件
export interface RuleCondition {
  eventType: InteractionEventType
  objectType?: PickObjectType
  objectId?: string
  propertyMatch?: Record<string, any>
}

// 交互规则
export interface InteractionRule {
  id: string
  name: string
  condition: RuleCondition
  actions: ActionConfig[]
  priority?: number
  enabled?: boolean
}

// 动作配置
export interface ActionConfig {
  type: string
  params: Record<string, any>
}
