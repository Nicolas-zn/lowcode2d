/**
 * RuleMatcher - 规则匹配引擎
 * 职责：匹配交互规则，条件判断，优先级排序
 */

import type { InteractionEvent } from '../event/types'
import type { InteractionRule } from './types'

export class RuleMatcher {
  private rules: InteractionRule[] = []

  /**
   * 添加规则
   */
  addRule(rule: InteractionRule): void {
    this.rules.push(rule)
    this.sortRules()
  }

  /**
   * 批量添加规则
   */
  addRules(rules: InteractionRule[]): void {
    this.rules.push(...rules)
    this.sortRules()
  }

  /**
   * 移除规则
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId)
  }

  /**
   * 匹配规则
   */
  match(event: InteractionEvent): InteractionRule[] {
    return this.rules.filter((rule) => {
      if (!rule.enabled) return false
      return this.matchCondition(rule, event)
    })
  }

  /**
   * 匹配条件
   */
  private matchCondition(rule: InteractionRule, event: InteractionEvent): boolean {
    const { condition } = rule

    // 事件类型匹配
    if (condition.eventType !== event.type) return false

    // 无拾取结果
    if (!event.pickResult) return false

    // 对象类型匹配
    if (condition.objectType && condition.objectType !== event.pickResult.type) {
      return false
    }

    // 对象ID匹配
    if (condition.objectId && condition.objectId !== event.pickResult.id) {
      return false
    }

    // 属性匹配
    if (condition.propertyMatch) {
      for (const [key, value] of Object.entries(condition.propertyMatch)) {
        if (event.pickResult.properties[key] !== value) {
          return false
        }
      }
    }

    return true
  }

  /**
   * 按优先级排序
   */
  private sortRules(): void {
    this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  /**
   * 清空规则
   */
  clear(): void {
    this.rules = []
  }
}
