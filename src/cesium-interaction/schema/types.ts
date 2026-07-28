/**
 * 低代码配置 Schema
 */

import type { InteractionRule } from '../rule/types'

// 完整的交互配置
export interface InteractionConfig {
  rules: InteractionRule[]
}

// 配置示例
export const exampleConfig: InteractionConfig = {
  rules: [
    {
      id: 'rule-1',
      name: '点击城市显示弹窗',
      condition: {
        eventType: 'click',
        objectType: 'entity',
        propertyMatch: {
          type: 'city'
        }
      },
      actions: [
        {
          type: 'popup',
          params: {
            title: '城市信息',
            content: '名称: {{name}}<br>人口: {{population}}'
          }
        }
      ],
      priority: 10,
      enabled: true
    },
    {
      id: 'rule-2',
      name: '悬停显示提示',
      condition: {
        eventType: 'hover',
        objectType: 'entity'
      },
      actions: [
        {
          type: 'tooltip',
          params: {
            content: '{{name}}'
          }
        },
        {
          type: 'highlight',
          params: {
            color: '#ffff00'
          }
        }
      ],
      priority: 5,
      enabled: true
    }
  ]
}
