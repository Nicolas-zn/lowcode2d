# Cesium 低代码交互系统使用指南

## 快速开始

### 1. 基础使用

```typescript
import { CesiumInteractionSystem } from '@/cesium-interaction'

const viewer = new Cesium.Viewer('cesiumContainer')
const system = new CesiumInteractionSystem(viewer)

// 加载配置
system.loadConfig({
  rules: [
    {
      id: 'rule-1',
      name: '点击显示弹窗',
      condition: {
        eventType: 'click',
        objectType: 'entity'
      },
      actions: [
        {
          type: 'popup',
          params: {
            title: '详情',
            content: '名称: {{name}}'
          }
        }
      ],
      enabled: true
    }
  ]
})
```

### 2. 配置说明

#### 规则配置 (InteractionRule)

```typescript
{
  id: string              // 规则唯一ID
  name: string            // 规则名称
  condition: {            // 触发条件
    eventType: 'click' | 'hover' | 'hoverEnd'
    objectType?: 'entity' | 'primitive' | '3dtiles'
    objectId?: string     // 匹配特定对象ID
    propertyMatch?: {     // 属性匹配
      type: 'city'
    }
  }
  actions: ActionConfig[] // 动作列表
  priority?: number       // 优先级（数字越大越优先）
  enabled?: boolean       // 是否启用
}
```

#### 动作配置 (ActionConfig)

**1. Popup 弹窗**
```typescript
{
  type: 'popup',
  params: {
    title: '标题',
    content: '内容支持模板 {{name}}'
  }
}
```

**2. Tooltip 提示**
```typescript
{
  type: 'tooltip',
  params: {
    content: '{{name}}'
  }
}
```

**3. Highlight 高亮**
```typescript
{
  type: 'highlight',
  params: {
    color: '#ffff00'
  }
}
```

**4. Request 请求**
```typescript
{
  type: 'request',
  params: {
    url: '/api/data',
    method: 'GET'
  }
}
```

### 3. 模板表达式

支持 `{{property}}` 格式访问对象属性：

```typescript
content: '城市: {{name}}, 人口: {{population}}'
```

支持嵌套属性：

```typescript
content: '{{user.name}}'
```

## 完整示例

见 `example-full.ts`
