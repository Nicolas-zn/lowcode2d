## 使用方式

### 订阅 Cesium 事件

```typescript
import { globalEventBus } from '@/core/GlobalEventBus'

globalEventBus.on('cesium:click', (event) => {
  console.log('点击事件:', event)
})
```

### 跨系统通信

```typescript
// Canvas 系统触发
globalEventBus.emit('canvas:elementSelected', { id: 'element1' })

// Cesium 系统监听
globalEventBus.on('canvas:elementSelected', (data) => {
  // 执行相应操作
})
```

### 获取子系统

```typescript
const cesiumSystem = globalEventBus.getSubsystem('cesium')
```
