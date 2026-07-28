# 快速开始

## 1. 基础使用

在 CesiumBrick 组件中配置事件：

```vue
<template>
  <CesiumBrick :events="events" />
</template>

<script setup>
const events = [
  {
    property: 'name',
    matchType: 'equal',
    value: 'cube',
    event: 'click',
    actions: ['showInfo', 'flyTo']
  }
]
</script>
```

## 2. 添加动作参数

```javascript
const events = [
  {
    property: 'name',
    matchType: 'equal',
    value: 'cube',
    event: 'click',
    actions: ['flyTo', 'changeColor'],
    actionParams: {
      flyTo: { 
        duration: 2,    // 飞行时长 2 秒
        offset: 1000    // 距离 1000 米
      },
      changeColor: { 
        color: '#FF0000',  // 红色
        alpha: 0.8         // 透明度 80%
      }
    }
  }
]
```

## 3. 多事件配置

```javascript
const events = [
  // 点击事件
  {
    property: 'name',
    value: 'building',
    event: 'click',
    actions: ['popup', 'flyTo']
  },
  // 悬停事件
  {
    property: 'name',
    value: 'building',
    event: 'hover',
    actions: ['highlight', 'tooltip']
  }
]
```

## 4. 使用可视化配置面板

```vue
<EventConfigPanel v-model="events" />
```

功能：
- ✅ 添加/删除事件
- ✅ 配置匹配规则
- ✅ 选择动作
- ✅ 配置动作参数
- ✅ 测试事件
- ✅ 检测对象
