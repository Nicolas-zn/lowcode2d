/**
 * RequestAction - 接口请求动作
 */

import type { IAction, ActionContext } from '../types'

export class RequestAction implements IAction {
  async execute(context: ActionContext): Promise<void> {
    const { object } = context

    console.log('发起请求:', object.id)

    try {
      const response = await fetch(`/api/object/${object.id}`)
      const data = await response.json()

      // 将结果存入上下文
      if (context.data) {
        context.data.requestResult = data
      }

      console.log('请求成功:', data)
    } catch (error) {
      console.error('请求失败:', error)
    }
  }
}
