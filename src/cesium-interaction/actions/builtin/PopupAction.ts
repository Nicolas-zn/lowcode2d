/**
 * PopupAction - 弹窗动作
 */

import { ElMessage } from 'element-plus'
import type { IAction, ActionContext } from '../types'

export class PopupAction implements IAction {
  execute(context: ActionContext): void {
    const { object } = context

    console.log('显示弹窗:', {
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
        : `弹窗信息: 实体名称=${object.name || object.id || '未知'} (类型: ${object.type})`

    ElMessage.success({
      message: showText,
      duration: context.params?.duration || 3000
    })
    // 触发自定义事件供 UI 层监听
    window.dispatchEvent(new CustomEvent('cesium:popup', {
      detail: {
        id: object.id,
        type: object.type,
        data: object.raw
      }
    }))
  }
}
