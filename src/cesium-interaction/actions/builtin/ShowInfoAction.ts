/**
 * ShowInfoAction - 显示对象信息
 */

import type { IAction, ActionContext } from '../types'
import { ElNotification } from 'element-plus'

export class ShowInfoAction implements IAction {
  execute(context: ActionContext): void {
    const { object, params } = context
    const title = params?.title || '对象信息'
    const duration = params?.duration || 3000

    const info = {
      ID: object.id,
      类型: object.type,
      名称: object.name || '未命名',
      位置: object.position ? '已定位' : '无位置'
    }

    ElNotification({
      title,
      message: Object.entries(info)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n'),
      duration,
      type: 'info'
    })
  }
}
