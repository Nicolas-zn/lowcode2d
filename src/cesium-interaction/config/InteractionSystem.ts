/**
 * InteractionSystem - 集成交互系统
 * 集成 InteractionEngine + RuleMatcher + ActionEngine
 */

import * as Cesium from 'cesium'
import { InteractionEngine } from '../core/InteractionEngine'
import { RuleMatcher } from './RuleMatcher'
import { ActionEngine } from '../actions/ActionEngine'
import { PopupAction } from '../actions/builtin/PopupAction'
import { TooltipAction } from '../actions/builtin/TooltipAction'
import { HighlightAction } from '../actions/builtin/HighlightAction'
import { RequestAction } from '../actions/builtin/RequestAction'
import { FlyToAction } from '../actions/builtin/FlyToAction'
import { ChangeColorAction } from '../actions/builtin/ChangeColorAction'
import { ShowInfoAction } from '../actions/builtin/ShowInfoAction'
import type { InteractionConfig } from './types'
import { InteractionEventType } from '../event/types'
import { globalEventBus } from '@/core/GlobalEventBus'

export class InteractionSystem {
  private engine: InteractionEngine
  private matcher: RuleMatcher
  private actionEngine: ActionEngine

  constructor(viewer: Cesium.Viewer) {
    this.engine = new InteractionEngine(viewer)
    this.matcher = new RuleMatcher()
    this.actionEngine = new ActionEngine()

    this.registerActions(viewer)
    this.bindEvents()

    // 注册到全局总线
    globalEventBus.registerSubsystem('cesium', this)
  }

  /**
   * 注册内置动作
   */
  private registerActions(viewer: Cesium.Viewer): void {
    this.actionEngine.register('popup', new PopupAction())
    this.actionEngine.register('tooltip', new TooltipAction())
    this.actionEngine.register('highlight', new HighlightAction(viewer))
    this.actionEngine.register('request', new RequestAction())
    this.actionEngine.register('flyTo', new FlyToAction(viewer))
    this.actionEngine.register('changeColor', new ChangeColorAction())
    this.actionEngine.register('showInfo', new ShowInfoAction())
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    this.engine.on(InteractionEventType.CLICK, (event) => this.handleEvent('click', event))
    this.engine.on(InteractionEventType.HOVER, (event) => this.handleEvent('hover', event))
    this.engine.on(InteractionEventType.HOVER_END, (event) => this.handleEvent('hoverEnd', event))
  }

  /**
   * 处理事件
   */
  private async handleEvent(eventType: string, event: any): Promise<void> {
    console.log('触发事件:', eventType, event.pickResult)
    const rules = this.matcher.match(eventType, event.pickResult)
    console.log('匹配到规则:', rules)

    for (const rule of rules) {
      await this.actionEngine.runActions(rule.actions, {
        object: event.pickResult,
        event: eventType,
        data: {}
      })
    }
  }

  /**
   * 加载配置
   */
  loadConfig(config: InteractionConfig): void {
    console.log('InteractionSystem.loadConfig:', config)
    this.matcher.loadRules(config.interactions)
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.engine.destroy()
  }
}
