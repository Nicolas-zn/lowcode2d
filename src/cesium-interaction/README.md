# Cesium 低代码交互系统

## 概述

基于 Cesium 的低代码交互系统，支持可视化配置地图对象的交互行为。

## 新增功能 ✨

### 1. 动作参数支持
所有动作现在支持自定义参数配置

### 2. 新增内置动作
- **flyTo**: 飞行到对象
- **changeColor**: 改变对象颜色
- **showInfo**: 显示对象信息

### 3. 可视化配置面板
- 动作参数配置对话框
- 事件测试功能
- 对象检测功能

## 内置动作列表

| 动作 | 说明 | 参数 |
|------|------|------|
| popup | 显示弹窗 | 无 |
| tooltip | 显示提示 | 无 |
| highlight | 高亮对象 | 无 |
| flyTo | 飞行到对象 | duration(秒), offset(米) |
| changeColor | 改变颜色 | color(颜色), alpha(透明度) |
| showInfo | 显示信息 | title(标题), duration(毫秒) |
| request | 请求接口 | url(地址), method(方法) |

## 使用示例

```javascript
const events = [
  {
    property: 'name',
    matchType: 'equal',
    value: 'cube',
    event: 'click',
    actions: ['flyTo', 'changeColor'],
    actionParams: {
      flyTo: { duration: 2, offset: 1000 },
      changeColor: { color: '#FF0000', alpha: 0.8 }
    }
  }
]
```

## 目录结构

```
src/cesium-interaction/
├── core/
│   ├── InteractionEngine.ts      # 交互引擎核心
│   ├── PickManager.ts            # 拾取管理器
│   └── EventHandler.ts           # 事件处理器
├── event/
│   ├── EventBus.ts               # 事件总线
│   └── types.ts                  # 事件类型定义
├── rule/
│   ├── RuleMatcher.ts            # 规则匹配引擎
│   └── types.ts                  # 规则类型定义
├── action/
│   ├── ActionEngine.ts           # 动作执行器
│   ├── actions/                  # 内置动作
│   │   ├── PopupAction.ts
│   │   ├── TooltipAction.ts
│   │   ├── HighlightAction.ts
│   │   └── RequestAction.ts
│   └── types.ts                  # 动作类型定义
├── state/
│   ├── StateStore.ts             # 状态管理
│   └── types.ts                  # 状态类型定义
├── ui/
│   ├── Popup.vue                 # 弹窗组件
│   ├── Tooltip.vue               # 提示组件
│   └── types.ts                  # UI类型定义
├── schema/
│   ├── types.ts                  # 配置Schema定义
│   └── validator.ts              # 配置验证器
├── utils/
│   ├── template.ts               # 模板表达式解析
│   └── cesium.ts                 # Cesium工具函数
└── index.ts                      # 统一导出
```

## 模块职责

### 1. InteractionEngine
- 初始化交互系统
- 管理 Cesium Viewer 实例
- 协调各模块工作

### 2. PickManager
- 封装 Cesium 拾取逻辑
- 统一拾取结果格式
- 支持多种拾取类型

### 3. EventHandler
- 监听 Cesium 鼠标事件
- 触发自定义事件
- 防抖/节流优化

### 4. EventBus
- 事件发布订阅
- 解耦模块通信

### 5. RuleMatcher
- 匹配交互规则
- 条件判断
- 优先级排序

### 6. ActionEngine
- 执行动作
- 动作链编排
- 上下文传递

### 7. StateStore
- 管理交互状态
- 高亮对象追踪
- 历史记录

### 8. UI层
- Popup 弹窗
- Tooltip 提示
- 响应式布局
