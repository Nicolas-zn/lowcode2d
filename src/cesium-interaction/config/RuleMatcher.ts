/**
 * RuleMatcher - 规则匹配器
 * 支持 target 匹配（图层/id）和 event 匹配
 */

import type { InteractionRule, TargetMatcher } from '../config/types'
import type { PickedObject } from '../core/types'

export class RuleMatcher {
  private rules: InteractionRule[] = []

  /**
   * 加载规则
   */
  loadRules(rules: InteractionRule[]): void {
    this.rules = rules.filter(r => r.enabled !== false)
  }

  /**
   * 匹配规则
   */
  match(event: string, obj: PickedObject | null): InteractionRule[] {
    console.log('RuleMatcher.match:', { event, obj, rules: this.rules })
    return this.rules.filter(rule => {
      // 事件匹配
      if (rule.event !== event) return false

      // 无对象时不匹配
      if (!obj) return false

      // target 匹配
      const matched = this.matchTarget(rule.target, obj)
      console.log('匹配结果:', { rule, obj, matched })
      return matched
    })
  }

  /**
   * 匹配 target
   */
  private matchTarget(target: string | TargetMatcher, obj: PickedObject): boolean {
    console.log('matchTarget:', { target, obj })

    // 字符串匹配（name 匹配）
    if (typeof target === 'string') {
      const result = obj.name === target
      console.log('字符串匹配:', { objName: obj.name, target, result })
      return result
    }

    // 对象匹配
    const matcher = target as TargetMatcher

    // 类型匹配
    if (matcher.type && matcher.type !== obj.type) {
      return false
    }

    // ID 匹配
    if (matcher.id && matcher.id !== obj.id) {
      return false
    }

    // Name 匹配
    if (matcher.name) {
      const matchType = matcher.nameMatch || 'equal'
      if (matchType === 'equal') {
        if (obj.name !== matcher.name) return false
      } else if (matchType === 'include') {
        if (!obj.name?.includes(matcher.name)) return false
      }
    }

    // 图层匹配（通过 id 前缀）
    if (matcher.layer && !obj.id?.startsWith(matcher.layer)) {
      return false
    }

    return true
  }
}
