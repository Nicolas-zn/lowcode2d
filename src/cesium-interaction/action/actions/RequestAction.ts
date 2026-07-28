/**
 * RequestAction - 请求动作
 */

import type { IAction, ActionContext } from '../types'

export class RequestAction implements IAction {
  async execute(params: Record<string, any>, context: ActionContext): Promise<void> {
    const { url, method = 'GET', headers = {} } = params

    try {
      const response = await fetch(url, {
        method,
        headers
      })
      const data = await response.json()

      // 将结果存入上下文
      context.data.requestResult = data
    } catch (error) {
      console.error('请求失败:', error)
    }
  }
}
