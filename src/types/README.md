# 类型定义说明

## 组件类型体系

### 核心设计理念

- **组件库组件**：包含 `defaultProps`，用于展示静态数据
- **业务组件**：不包含 `defaultProps`，数据通过 API 动态获取
- **title 字段**：从 `props` 中提取出来，作为独立字段

### 1. 基础组件配置 (`BaseComponentConfig`)

所有组件的共同部分：

```typescript
interface BaseComponentConfig {
  type: string              // 组件类型（Vue 组件名）
  name: string              // 显示名称
  icon: string              // 图标类名
  title: string             // 组件标题
  defaultWidth: number      // 默认宽度
  defaultHeight: number     // 默认高度
}
```

### 2. 组件库组件配置 (`BrickConfig`)

用于展示静态数据的组件：

```typescript
interface BrickConfig extends BaseComponentConfig {
  defaultProps: ComponentProps  // 默认属性（包含静态数据）
}
```

**示例**：
```javascript
{
  type: 'EChartBrick',
  name: '柱状图',
  icon: 'bi-bar-chart-fill',
  title: '每周销售数据',        // title 独立字段
  defaultProps: {
    // 注意：不包含 title
    data: {
      xAxis: ['周一', '周二', '周三'],
      series: [{ name: '销售额', data: [120, 200, 150] }]
    }
  },
  defaultWidth: 450,
  defaultHeight: 320
}
```

### 3. 业务组件配置 (`BusinessComponentConfig`)

通过 API 动态获取数据的组件：

```typescript
interface BusinessComponentConfig extends BaseComponentConfig {
  api: ApiConfig            // 预配置的 API
  isBusinessComponent: true // 业务组件标记
  // 注意：没有 defaultProps，数据从 API 获取
}
```

**示例**：
```javascript
{
  type: 'EChartBrick',
  name: '资产统计图表',
  icon: 'bi-bar-chart-fill',
  title: '资产数据统计',        // title 独立字段
  // 没有 defaultProps！数据从 API 获取
  defaultWidth: 450,
  defaultHeight: 320,
  api: {
    url: 'http://localhost:3001',
    suffix: '/api/asset',
    method: 'GET',
    token: ''
  },
  isBusinessComponent: true
}
```

### 3. 组件实例 (`ComponentInstance`)

画布上的组件实例：

```typescript
interface ComponentInstance {
  id: number | string       // 唯一标识
  name: string              // 组件名称
  type: string              // 组件类型
  x: number                 // X 坐标
  y: number                 // Y 坐标
  width: number             // 宽度
  height: number            // 高度
  props: ComponentProps     // 组件属性
  api?: ApiConfig           // API 配置（可选）
  isBusinessComponent?: boolean  // 是否为业务组件
}
```

### 4. API 配置 (`ApiConfig`)

```typescript
interface ApiConfig {
  url: string               // 请求地址
  suffix: string            // 请求后缀
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  token?: string            // 可选的令牌
  headers?: Record<string, string>  // 可选的请求头
  _t?: number               // 时间戳（用于强制更新）
}
```

## 使用方式

### 在 JavaScript 文件中使用 JSDoc

```javascript
/**
 * @type {import('../types/component').BusinessComponentConfig[]}
 */
const businessComponents = [
  {
    type: 'EChartBrick',
    name: '业务组件',
    // ...
  }
]
```

### 在 TypeScript 文件中使用

```typescript
import type { BusinessComponentConfig, ComponentInstance } from '@/types/component'

const config: BusinessComponentConfig = {
  // ...
}
```

### 类型守卫

```typescript
import { isBusinessComponentConfig } from '@/types/component'

if (isBusinessComponentConfig(config)) {
  // config 被推断为 BusinessComponentConfig
  console.log(config.api)
}
```

## 数据格式统一原则

1. **title 独立**：`title` 从 `props` 中提取为独立字段
2. **组件库组件**：必须有 `defaultProps`（包含静态数据）
3. **业务组件**：不需要 `defaultProps`（数据从 API 获取）
4. **组件实例**：`props` 中包含 `title` 和其他数据
5. **API 配置**：业务组件使用 `api` 字段，包含完整的请求信息

## 关键区别

| 特性 | 组件库组件 | 业务组件 |
|------|-----------|---------|
| `title` | ✅ 独立字段 | ✅ 独立字段 |
| `defaultProps` | ✅ 必须有（包含静态数据） | ❌ 没有 |
| `api` | ❌ 没有 | ✅ 必须有 |
| 数据来源 | 静态配置 | API 动态获取 |

## 迁移指南

### 组件库组件：提取 title

**旧格式**：
```javascript
{
  type: 'EChartBrick',
  name: '柱状图',
  defaultProps: {
    title: '每周销售数据',  // ❌ title 在 props 里
    data: { ... }
  }
}
```

**新格式**：
```javascript
{
  type: 'EChartBrick',
  name: '柱状图',
  title: '每周销售数据',    // ✅ title 提取出来
  defaultProps: {
    // 不包含 title
    data: { ... }
  }
}
```

### 业务组件：移除 defaultProps

**旧格式**：
```javascript
{
  type: 'EChartBrick',
  name: '资产统计',
  defaultProps: {           // ❌ 不需要
    title: '资产数据',
    data: { ... }
  },
  api: { ... }
}
```

**新格式**：
```javascript
{
  type: 'EChartBrick',
  name: '资产统计',
  title: '资产数据',        // ✅ 只有 title
  // 没有 defaultProps
  api: { ... }              // 数据从 API 获取
}
```
