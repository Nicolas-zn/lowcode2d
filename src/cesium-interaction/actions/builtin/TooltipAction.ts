/**
 * TooltipAction - 提示动作
 */

import type { IAction, ActionContext } from '../types'
import { ElMessage } from 'element-plus'

export class TooltipAction implements IAction {
  execute(context: ActionContext): void {
    const { object } = context

    console.log('显示提示:', {
      id: object.id,
      type: object.type,
      position: object.position,
      customParams: context.params
    })
    
    // 如果在事件配置里带有自定义的参数文本，优先显示自定文本
    const rawContent = context.params?.content || ''
    // 置换一下通用的占位符（如 ${name}）
    const showText = rawContent
        ? rawContent.replace(/\$\{name\}/g, object.name || object.id || '未知')
        : `Hover 提示信息: 模型=${object.name || object.id || '未知'} (类型: ${object.type})`
    
    ElMessage.info({
      message: showText,
      duration: context.params?.duration || 2000
    })

    window.dispatchEvent(new CustomEvent('cesium:tooltip', {
      detail: {
        id: object.id,
        type: object.type
      }
    }))
  }
}
