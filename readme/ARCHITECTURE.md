# 全局事件总线架构

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│              GlobalEventBus (全局事件总线)                │
│  - 单例模式                                              │
│  - 统一事件管理                                          │
│  - 子系统注册与管理                                       │
│  - 跨系统通信                                            │
└─────────────────────────────────────────────────────────┘
           ↑                    ↑                  ↑
           │                    │                  │
    ┌──────┴──────┐      ┌──────┴──────┐   ┌──────┴──────┐
    │   Cesium    │      │   Canvas    │   │   其他子系统  │
    │   子系统     │      │   子系统     │   │   ...       │
    └─────────────┘      └─────────────┘   └─────────────┘
         │
         ├─ EventHandler (监听 Cesium 事件)
         ├─ CesiumEventBridge (桥接到全局)
         └─ InteractionSystem (交互系统)
```

## 事件流

```
Cesium 用户交互
    ↓
EventHandler 捕获
    ↓
本地 listeners 触发
    ↓
CesiumEventBridge 桥接
    ↓
GlobalEventBus 分发
    ↓
所有订阅者接收
```

## 核心组件

### 1. GlobalEventBus
- 单例模式
- 管理所有子系统
- 统一事件分发

### 2. CesiumEventBridge
- 桥接 Cesium 事件到全局
- 事件前缀: `cesium:`

### 3. InteractionSystem
- 注册到全局总线
- 自动桥接所有交互事件

## 事件命名规范

```
<子系统>:<事件类型>

例如:
- cesium:click
- cesium:hover
- canvas:elementSelected
- global:systemReady
```

## 完整示例

```typescript
// 1. 初始化 Cesium 系统（自动注册到全局总线）
const interactionSystem = new InteractionSystem(viewer)

// 2. 在任何地方订阅事件
import { globalEventBus } from '@/core/GlobalEventBus'

globalEventBus.on('cesium:click', (event) => {
  console.log('全局监听到点击:', event)
})

// 3. 跨系统通信
globalEventBus.on('canvas:elementSelected', (data) => {
  // Canvas 选中元素时，Cesium 飞到对应位置
  const cesium = globalEventBus.getSubsystem('cesium')
  // 执行操作...
})
```

## 优势

1. **解耦**: 子系统独立，通过事件通信
2. **扩展**: 新增子系统只需注册到全局总线
3. **统一**: 所有事件统一管理，便于调试
4. **灵活**: 支持跨系统通信

