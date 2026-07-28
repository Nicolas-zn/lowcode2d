# 核心模块

## GlobalEventBus

全局事件总线，单例模式，管理所有子系统的事件。

### API

```typescript
// 获取实例
const bus = GlobalEventBus.getInstance()

// 注册子系统
bus.registerSubsystem('cesium', cesiumSystem)

// 获取子系统
const cesium = bus.getSubsystem('cesium')

// 订阅事件
bus.on('cesium:click', callback)

// 触发事件
bus.emit('cesium:click', data)

// 取消订阅
bus.off('cesium:click', callback)
```
