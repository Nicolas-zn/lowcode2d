# 低代码交互配置系统

## 配置结构

```typescript
{
  "interactions": [
    {
      "target": "building-001",  // 简单字符串匹配 id
      "event": "click",
      "actions": ["popup"]
    }
  ]
}
```

## Target 匹配方式

### 1. 字符串匹配（精确 ID）
```json
{
  "target": "building-001",
  "event": "click",
  "actions": ["popup"]
}
```

### 2. 对象匹配（多条件）
```json
{
  "target": {
    "type": "entity",        // 类型匹配
    "id": "building-001",    // ID 匹配
    "layer": "building"      // 图层匹配（id 前缀）
  },
  "event": "hover",
  "actions": ["tooltip"]
}
```

## 支持的事件

- `click` - 点击
- `hover` - 悬停
- `hoverEnd` - 离开

## 匹配规则

1. **事件匹配**：必须完全匹配
2. **类型匹配**：entity / primitive / 3dtiles
3. **ID 匹配**：精确匹配对象 id
4. **图层匹配**：通过 id 前缀匹配（如 `building-001` 匹配 `building`）

## 使用示例

见 `example-config.ts`
