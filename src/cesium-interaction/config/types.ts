/**
 * 低代码交互配置类型定义
 */

export interface InteractionConfig {
  interactions: InteractionRule[]
}

export interface InteractionRule {
  id?: string
  target: string | TargetMatcher
  event: 'click' | 'hover' | 'hoverEnd'
  actions: string[]
  enabled?: boolean
}

export interface TargetMatcher {
  type?: 'entity' | 'primitive' | '3dtiles'
  id?: string
  name?: string
  nameMatch?: 'equal' | 'include'
  layer?: string
  property?: Record<string, any>
}
