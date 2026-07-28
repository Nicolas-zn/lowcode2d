# lowcode2D 低代码交互系统方案

## 1. 系统架构概览

lowcode2D 交互系统采用分层架构，由五个核心模块组成：

```
┌─────────────────────────────────────────┐
│         Expression Engine               │  表达式解析层
├─────────────────────────────────────────┤
│          Action Engine                  │  动作执行层
├─────────────────────────────────────────┤
│         Event System                    │  事件管理层
├─────────────────────────────────────────┤
│        State Manager                    │  状态管理层
├─────────────────────────────────────────┤
│          Renderer                       │  渲染层 (Konva.js)
└─────────────────────────────────────────┘
```

### 技术栈
- **渲染引擎**: Konva.js (Canvas 2D)
- **状态管理**: Pinia
- **UI 框架**: Vue 3 + Element Plus
- **表达式解析**: 自定义 AST 解析器

---

## 2. Renderer（渲染器）

### 2.1 核心职责
- 基于 Konva.js 渲染画布组件
- 管理图层（Layer）和形状（Shape）
- 处理组件的增删改查
- 响应式更新视图

### 2.2 组件类型定义

```typescript
// src/renderer/types.ts
export enum ComponentType {
  RECT = 'rect',
  CIRCLE = 'circle',
  TEXT = 'text',
  IMAGE = 'image',
  LINE = 'line',
  GROUP = 'group',
  CHART = 'chart'
}

export interface BaseComponent {
  id: string
  type: ComponentType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  zIndex: number

  // 样式属性
  fill?: string
  stroke?: string
  strokeWidth?: number

  // 交互配置
  draggable: boolean
  interactive: boolean

  // 事件绑定
  events?: EventBinding[]

  // 数据绑定
  dataBinding?: DataBinding
}
```

### 2.3 渲染器实现

```typescript
// src/renderer/KonvaRenderer.ts
import Konva from 'konva'
import { useStateManager } from '@/state'

export class KonvaRenderer {
  private stage: Konva.Stage
  private layer: Konva.Layer
  private componentMap: Map<string, Konva.Node>

  constructor(container: HTMLDivElement) {
    this.stage = new Konva.Stage({
      container,
      width: window.innerWidth,
      height: window.innerHeight
    })

    this.layer = new Konva.Layer()
    this.stage.add(this.layer)
    this.componentMap = new Map()
  }

  // 渲染组件
  renderComponent(component: BaseComponent): void {
    const node = this.createKonvaNode(component)
    this.componentMap.set(component.id, node)
    this.layer.add(node)
    this.layer.batchDraw()
  }

  // 更新组件
  updateComponent(id: string, updates: Partial<BaseComponent>): void {
    const node = this.componentMap.get(id)
    if (node) {
      node.setAttrs(updates)
      this.layer.batchDraw()
    }
  }

  // 删除组件
  removeComponent(id: string): void {
    const node = this.componentMap.get(id)
    if (node) {
      node.destroy()
      this.componentMap.delete(id)
      this.layer.batchDraw()
    }
  }

  private createKonvaNode(component: BaseComponent): Konva.Node {
    switch (component.type) {
      case ComponentType.RECT:
        return new Konva.Rect(component)
      case ComponentType.CIRCLE:
        return new Konva.Circle(component)
      case ComponentType.TEXT:
        return new Konva.Text(component)
      case ComponentType.IMAGE:
        return this.createImage(component)
      default:
        throw new Error(`Unknown component type: ${component.type}`)
    }
  }

  private createImage(component: BaseComponent): Konva.Image {
    const imageObj = new Image()
    const konvaImage = new Konva.Image({
      ...component,
      image: imageObj
    })

    imageObj.onload = () => {
      this.layer.batchDraw()
    }
    imageObj.src = component.src

    return konvaImage
  }
}
```

---

## 3. Event System（事件系统）

### 3.1 事件类型定义

```typescript
// src/events/types.ts
export enum EventType {
  // 鼠标事件
  CLICK = 'click',
  DBLCLICK = 'dblclick',
  MOUSEENTER = 'mouseenter',
  MOUSELEAVE = 'mouseleave',
  MOUSEDOWN = 'mousedown',
  MOUSEUP = 'mouseup',
  MOUSEMOVE = 'mousemove',

  // 生命周期事件
  MOUNTED = 'mounted',
  UPDATED = 'updated',
  DESTROYED = 'destroyed',

  // 数据事件
  DATA_CHANGE = 'dataChange',
  STATE_CHANGE = 'stateChange',

  // 定时器事件
  TIMER = 'timer',
  INTERVAL = 'interval'
}

export interface EventBinding {
  id: string
  eventType: EventType
  actions: ActionConfig[]
  condition?: string  // 表达式条件
  debounce?: number
  throttle?: number
}
```

### 3.2 事件管理器

```typescript
// src/events/EventManager.ts
import { EventEmitter } from 'events'
import { ActionEngine } from '@/actions'
import { ExpressionEngine } from '@/expressions'

export class EventManager extends EventEmitter {
  private actionEngine: ActionEngine
  private expressionEngine: ExpressionEngine
  private eventBindings: Map<string, EventBinding[]>

  constructor() {
    super()
    this.actionEngine = new ActionEngine()
    this.expressionEngine = new ExpressionEngine()
    this.eventBindings = new Map()
  }

  // 注册事件
  registerEvent(componentId: string, binding: EventBinding): void {
    const bindings = this.eventBindings.get(componentId) || []
    bindings.push(binding)
    this.eventBindings.set(componentId, bindings)
  }

  // 触发事件
  async triggerEvent(
    componentId: string,
    eventType: EventType,
    eventData?: any
  ): Promise<void> {
    const bindings = this.eventBindings.get(componentId) || []

    for (const binding of bindings) {
      if (binding.eventType !== eventType) continue

      // 条件判断
      if (binding.condition) {
        const result = this.expressionEngine.evaluate(
          binding.condition,
          eventData
        )
        if (!result) continue
      }

      // 执行动作
      await this.actionEngine.executeActions(binding.actions, eventData)
    }
  }

  // 防抖处理
  private debounce(fn: Function, delay: number) {
    let timer: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timer)
      timer = setTimeout(() => fn(...args), delay)
    }
  }

  // 节流处理
  private throttle(fn: Function, delay: number) {
    let last = 0
    return (...args: any[]) => {
      const now = Date.now()
      if (now - last >= delay) {
        last = now
        fn(...args)
      }
    }
  }
}
```

---

## 4. State Manager（状态管理）

### 4.1 状态定义

```typescript
// src/state/types.ts
export interface AppState {
  components: Map<string, BaseComponent>
  selectedIds: string[]
  variables: Map<string, any>
  dataSource: Map<string, DataSource>
}

export interface DataSource {
  id: string
  type: 'api' | 'static' | 'websocket'
  config: ApiConfig | StaticConfig
  data: any
  loading: boolean
  error: string | null
}
```

### 4.2 Pinia Store

```typescript
// src/state/store.ts
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    components: new Map(),
    selectedIds: [],
    variables: new Map(),
    dataSource: new Map()
  }),

  getters: {
    getComponent: (state) => (id: string) => state.components.get(id),
    getVariable: (state) => (key: string) => state.variables.get(key)
  },

  actions: {
    addComponent(component: BaseComponent) {
      this.components.set(component.id, component)
    },

    updateComponent(id: string, updates: Partial<BaseComponent>) {
      const component = this.components.get(id)
      if (component) Object.assign(component, updates)
    },

    setVariable(key: string, value: any) {
      this.variables.set(key, value)
    },

    async fetchDataSource(id: string) {
      const ds = this.dataSource.get(id)
      if (!ds || ds.type !== 'api') return

      ds.loading = true
      try {
        const response = await fetch(ds.config.url, {
          method: ds.config.method,
          headers: ds.config.headers
        })
        ds.data = await response.json()
      } catch (error) {
        ds.error = error.message
      } finally {
        ds.loading = false
      }
    }
  }
})
```

---

## 5. Action Engine（动作执行器）

### 5.1 动作类型定义

```typescript
// src/actions/types.ts
export enum ActionType {
  SET_VARIABLE = 'setVariable',
  UPDATE_COMPONENT = 'updateComponent',
  NAVIGATE = 'navigate',
  SHOW_MESSAGE = 'showMessage',
  HTTP_REQUEST = 'httpRequest',
  OPEN_DIALOG = 'openDialog',
  CLOSE_DIALOG = 'closeDialog',
  CUSTOM_CODE = 'customCode'
}

export interface ActionConfig {
  id: string
  type: ActionType
  params: Record<string, any>
  async?: boolean
}
```

### 5.2 动作执行器实现

```typescript
// src/actions/ActionEngine.ts
import { useAppStore } from '@/state'
import { ExpressionEngine } from '@/expressions'

export class ActionEngine {
  private expressionEngine: ExpressionEngine
  private store = useAppStore()

  constructor() {
    this.expressionEngine = new ExpressionEngine()
  }

  async executeActions(actions: ActionConfig[], context?: any): Promise<void> {
    for (const action of actions) {
      await this.executeAction(action, context)
    }
  }

  private async executeAction(action: ActionConfig, context?: any): Promise<void> {
    const params = this.resolveParams(action.params, context)

    switch (action.type) {
      case ActionType.SET_VARIABLE:
        this.store.setVariable(params.key, params.value)
        break

      case ActionType.UPDATE_COMPONENT:
        this.store.updateComponent(params.id, params.updates)
        break

      case ActionType.HTTP_REQUEST:
        await this.httpRequest(params)
        break

      case ActionType.SHOW_MESSAGE:
        ElMessage({ message: params.message, type: params.type })
        break

      case ActionType.CUSTOM_CODE:
        await this.executeCustomCode(params.code, context)
        break
    }
  }

  private resolveParams(params: Record<string, any>, context?: any): any {
    const resolved = {}
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('{{')) {
        resolved[key] = this.expressionEngine.evaluate(value, context)
      } else {
        resolved[key] = value
      }
    }
    return resolved
  }

  private async httpRequest(params: any): Promise<void> {
    const response = await fetch(params.url, {
      method: params.method,
      headers: params.headers,
      body: params.body ? JSON.stringify(params.body) : undefined
    })
    const data = await response.json()
    if (params.resultVariable) {
      this.store.setVariable(params.resultVariable, data)
    }
  }

  private async executeCustomCode(code: string, context?: any): Promise<void> {
    const fn = new Function('context', 'store', code)
    await fn(context, this.store)
  }
}
```

---

## 6. Expression Engine（表达式解析）

### 6.1 表达式语法

支持的表达式类型：
- 变量引用：`{{variable}}`
- 对象属性：`{{user.name}}`
- 数组索引：`{{list[0]}}`
- 运算符：`{{a + b}}`, `{{x > 10}}`
- 函数调用：`{{sum(a, b)}}`

### 6.2 表达式引擎实现

```typescript
// src/expressions/ExpressionEngine.ts
export class ExpressionEngine {
  private store = useAppStore()

  evaluate(expression: string, context?: any): any {
    const cleaned = expression.replace(/{{|}}/g, '').trim()
    
    try {
      const fn = new Function(
        'context',
        'store',
        `with(context || {}) { return ${cleaned} }`
      )
      return fn(context, this.store)
    } catch (error) {
      console.error('Expression evaluation error:', error)
      return null
    }
  }

  evaluateCondition(condition: string, context?: any): boolean {
    return Boolean(this.evaluate(condition, context))
  }
}
```

---

## 7. 完整示例

### 7.1 配置示例

```json
{
  "id": "btn-001",
  "type": "rect",
  "name": "提交按钮",
  "x": 100,
  "y": 100,
  "width": 120,
  "height": 40,
  "fill": "#409EFF",
  "events": [
    {
      "id": "evt-001",
      "eventType": "click",
      "condition": "{{count < 10}}",
      "actions": [
        {
          "id": "act-001",
          "type": "setVariable",
          "params": {
            "key": "count",
            "value": "{{count + 1}}"
          }
        },
        {
          "id": "act-002",
          "type": "httpRequest",
          "params": {
            "url": "/api/submit",
            "method": "POST",
            "body": {
              "count": "{{count}}"
            },
            "resultVariable": "response"
          }
        },
        {
          "id": "act-003",
          "type": "showMessage",
          "params": {
            "message": "提交成功",
            "type": "success"
          }
        }
      ]
    }
  ]
}
```

### 7.2 使用示例

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { KonvaRenderer } from '@/renderer'
import { EventManager } from '@/events'

const app = createApp(App)
app.use(createPinia())

// 初始化渲染器
const container = document.getElementById('canvas')
const renderer = new KonvaRenderer(container)

// 初始化事件管理器
const eventManager = new EventManager()

// 渲染组件
const button = {
  id: 'btn-001',
  type: 'rect',
  x: 100,
  y: 100,
  width: 120,
  height: 40,
  fill: '#409EFF'
}

renderer.renderComponent(button)

// 绑定事件
eventManager.registerEvent('btn-001', {
  id: 'evt-001',
  eventType: EventType.CLICK,
  actions: [
    {
      id: 'act-001',
      type: ActionType.SHOW_MESSAGE,
      params: { message: '按钮被点击', type: 'success' }
    }
  ]
})
```

---

## 8. 数据绑定

### 8.1 数据绑定配置

```typescript
export interface DataBinding {
  source: string        // 数据源ID
  field: string         // 字段路径
  transform?: string    // 转换表达式
}

// 示例
{
  "id": "text-001",
  "type": "text",
  "text": "{{userName}}",
  "dataBinding": {
    "source": "userApi",
    "field": "data.name",
    "transform": "{{value.toUpperCase()}}"
  }
}
```

### 8.2 数据监听

```typescript
// src/state/watcher.ts
import { watch } from 'vue'
import { useAppStore } from './store'

export function setupDataBinding(renderer: KonvaRenderer) {
  const store = useAppStore()

  watch(
    () => store.variables,
    (newVars) => {
      store.components.forEach((component) => {
        if (component.dataBinding) {
          const value = store.getVariable(component.dataBinding.field)
          renderer.updateComponent(component.id, { text: value })
        }
      })
    },
    { deep: true }
  )
}
```

---

## 9. 目录结构

```
src/
├── renderer/
│   ├── KonvaRenderer.ts
│   └── types.ts
├── events/
│   ├── EventManager.ts
│   └── types.ts
├── state/
│   ├── store.ts
│   ├── watcher.ts
│   └── types.ts
├── actions/
│   ├── ActionEngine.ts
│   └── types.ts
├── expressions/
│   └── ExpressionEngine.ts
└── main.ts
```

---

## 10. 核心特性

### 10.1 事件驱动
- 支持鼠标、生命周期、数据变化等多种事件
- 防抖/节流优化
- 条件触发

### 10.2 动作编排
- 链式执行多个动作
- 支持异步操作
- 参数表达式解析

### 10.3 状态管理
- 集中式状态存储
- 响应式数据绑定
- 数据源管理

### 10.4 表达式系统
- 变量引用和计算
- 条件判断
- 函数调用

### 10.5 渲染优化
- 批量渲染
- 按需更新
- 图层管理

---

## 11. 扩展性

### 11.1 自定义动作

```typescript
ActionEngine.registerAction('customAction', async (params, context) => {
  // 自定义逻辑
})
```

### 11.2 自定义组件

```typescript
KonvaRenderer.registerComponent('customComponent', (config) => {
  return new Konva.Group(config)
})
```

### 11.3 插件系统

```typescript
export interface Plugin {
  install(app: App): void
}

const chartPlugin: Plugin = {
  install(app) {
    // 注册 ECharts 组件
  }
}
```

---

## 12. 性能优化

- 使用 `requestAnimationFrame` 批量更新
- 虚拟滚动处理大量组件
- 事件委托减少监听器
- 表达式结果缓存
- 按需加载组件库

---

## 13. 总结

该交互系统提供了完整的低代码能力：

1. **Renderer** - 基于 Konva.js 的高性能 2D 渲染
2. **Event System** - 灵活的事件管理和触发机制
3. **State Manager** - 响应式状态管理和数据绑定
4. **Action Engine** - 可编排的动作执行引擎
5. **Expression Engine** - 强大的表达式解析能力

通过这五个模块的协同工作，实现了可视化编辑、交互配置、数据驱动的低代码开发体验。
