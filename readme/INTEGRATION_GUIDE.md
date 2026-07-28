# LowCode2D 集成指南

## 📋 目录

1. [集成概述](#集成概述)
2. [集成方式](#集成方式)
3. [核心模块说明](#核心模块说明)
4. [集成步骤](#集成步骤)
5. [需要开发的新功能](#需要开发的新功能)
6. [API 接口设计](#api-接口设计)
7. [注意事项](#注意事项)

---

## 🎯 集成概述

LowCode2D 是一个基于 Vue3 的低代码可视化编辑器，可以通过以下方式集成到其他项目中：

### 适用场景

- ✅ 数据大屏可视化平台
- ✅ 报表设计器
- ✅ 营销活动页面编辑器
- ✅ 仪表盘设计工具
- ✅ 低代码应用搭建平台

### 集成收益

- 🚀 快速搭建可视化页面，无需编写代码
- 🎨 拖拽式设计，所见即所得
- 📊 丰富的图表组件库（基于 ECharts）
- 🔌 灵活的数据源配置和转换
- 💾 支持模板保存和分享
- 📱 多屏幕自适应方案

---

## 🔧 集成方式

### 方式一：作为独立子应用（推荐）

将 LowCode2D 作为微前端子应用集成，适合大型系统。

**优势：**

- 独立部署和维护
- 技术栈隔离
- 版本独立升级
- 减少主应用体积

**适用框架：**

- qiankun（阿里）
- micro-app（京东）
- iframe 方案

### 方式二：作为 NPM 包集成

将核心功能封装为 NPM 包，在主项目中引入。

**优势：**

- 集成简单
- 共享主应用上下文
- 通信便捷

**适用场景：**

- Vue 3 项目
- 中小型系统

### 方式三：源码直接集成

将源码复制到项目中，进行深度定制。

**优势：**

- 完全可控
- 深度定制
- 无版本依赖

**适用场景：**

- 需要深度定制
- 项目技术栈一致

---

## 📦 核心模块说明

### 1. 组件库模块 (bricks/)

包含所有可拖拽的组件，如图表、表格、卡片等。

**关键文件：**

```
src/bricks/
├── index.js              # 组件注册中心
├── EChartBrick.vue       # 通用图表组件
├── TableBrick.vue        # 表格组件
├── StatCardBrick.vue     # 统计卡片
└── ...
```

**集成要点：**

- 可独立使用任意组件
- 支持自定义扩展组件
- 统一的 props 接口设计

### 2. 状态管理模块 (stores/)

基于 Pinia 的状态管理。

**核心 Store：**

- `panelStore.js` - 画布组件管理
- `dataSourceStore.js` - 数据源管理
- `dataTransformStore.js` - 数据转换逻辑
- `themeStore.js` - 主题管理
- `historyStore.js` - 撤销/重做
- `variableStore.js` - 全局变量
- `eventBusStore.js` - 事件总线

**集成要点：**

- 需要在主应用中注册 Pinia
- 可按需引入所需的 Store
- 支持与现有状态管理集成

### 3. 编辑器核心 (components/)

可视化编辑器的核心组件。

**主要组件：**

- `CanvasPanel.vue` - 画布面板（核心）
- `Sidebar.vue` - 侧边栏（组件库、图层等）
- `PropertyPanel.vue` - 属性面板
- `Toolbar.vue` - 工具栏
- `ComponentLibrary.vue` - 组件选择器

**集成要点：**

- 可单独使用画布组件
- 支持自定义工具栏
- 可配置侧边栏模块

### 4. 数据处理模块

数据获取、转换和绑定。

**功能模块：**

- API 数据源配置
- Mock 数据支持
- WebSocket 实时数据
- 数据转换规则引擎
- 数据映射和聚合

---

## 🚀 集成步骤

### 步骤 1：环境准备

#### 1.1 安装依赖

```bash
npm install vue@^3.5.24 pinia@^3.0.4 element-plus@^2.13.0 echarts@^6.0.0
npm install vue-draggable-resizable@^3.0.0 @element-plus/icons-vue@^2.3.2
```

#### 1.2 配置 Vite（如果使用 Vite）

```javascript
// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
```

### 步骤 2：复制核心代码

```bash
# 复制以下目录到你的项目中
cp -r lowcode2D/src/bricks your-project/src/
cp -r lowcode2D/src/stores your-project/src/
cp -r lowcode2D/src/components your-project/src/
cp -r lowcode2D/src/styles your-project/src/
cp -r lowcode2D/src/utils your-project/src/
cp -r lowcode2D/src/business your-project/src/
cp -r lowcode2D/src/config your-project/src/
```

### 步骤 3：配置主应用

#### 3.1 注册 Pinia

```javascript
// main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount("#app");
```

#### 3.2 引入 Element Plus

```javascript
// main.js
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

app.use(ElementPlus);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
```

#### 3.3 引入全局样式

```javascript
// main.js
import "./styles/variables.css";
import "./styles/global.css";
```

### 步骤 4：使用编辑器

#### 方式 A：完整编辑器页面

```vue
<!-- EditorPage.vue -->
<template>
  <div class="editor-page">
    <Toolbar />
    <div class="editor-content">
      <Sidebar />
      <CanvasPanel />
      <PropertyPanel />
    </div>
  </div>
</template>

<script setup>
import Toolbar from "@/components/Toolbar.vue";
import Sidebar from "@/components/Sidebar.vue";
import CanvasPanel from "@/components/CanvasPanel.vue";
import PropertyPanel from "@/components/PropertyPanel.vue";
</script>

<style scoped>
.editor-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
```

#### 方式 B：仅使用画布组件

```vue
<!-- SimpleCanvas.vue -->
<template>
  <div class="simple-canvas">
    <CanvasPanel :readonly="false" :show-toolbar="true" />
  </div>
</template>

<script setup>
import CanvasPanel from "@/components/CanvasPanel.vue";
</script>
```

### 步骤 5：配置路由

```javascript
// router.js
import { createRouter, createWebHistory } from "vue-router";
import EditorPage from "@/views/EditorPage.vue";
import PreviewPage from "@/views/HashView.vue";

const routes = [
  {
    path: "/editor",
    name: "Editor",
    component: EditorPage,
  },
  {
    path: "/preview/:id",
    name: "Preview",
    component: PreviewPage,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

---

## 🆕 需要开发的新功能

### 1. 后端 API 服务

#### 1.1 模板管理 API

```javascript
// 保存模板
POST /api/templates
{
  "name": "销售大屏",
  "description": "销售数据展示",
  "components": [...],  // 组件配置
  "thumbnail": "base64", // 缩略图
  "tags": ["销售", "数据大屏"]
}

// 获取模板列表
GET /api/templates?page=1&size=20&tag=销售

// 获取模板详情
GET /api/templates/:id

// 更新模板
PUT /api/templates/:id

// 删除模板
DELETE /api/templates/:id

// 发布模板
POST /api/templates/:id/publish
```

#### 1.2 数据源代理 API

为了安全和跨域问题，建议后端代理数据请求：

```javascript
// 代理数据请求
POST /api/proxy/fetch
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {},
  "body": null
}

// 数据源配置管理
GET /api/datasources
POST /api/datasources
PUT /api/datasources/:id
DELETE /api/datasources/:id
```

#### 1.3 用户权限 API

```javascript
// 用户模板列表
GET /api/user/templates

// 模板权限管理
POST /api/templates/:id/permissions
{
  "userId": "123",
  "permission": "edit" // view, edit, admin
}

// 团队共享
POST /api/templates/:id/share
{
  "teamId": "456",
  "permission": "view"
}
```

### 2. 文件存储服务

#### 2.1 图片上传

```javascript
// 上传图片
POST /api/upload/image
Content-Type: multipart/form-data

// 返回
{
  "url": "https://cdn.example.com/images/xxx.png",
  "width": 1920,
  "height": 1080
}
```

#### 2.2 资源管理

```javascript
// 资源库
GET /api/resources?type=image

// 删除资源
DELETE /api/resources/:id
```

### 3. 导出功能增强

#### 3.1 服务端渲染导出

```javascript
// 导出为图片（服务端渲染）
POST /api/export/image
{
  "templateId": "123",
  "format": "png", // png, jpg
  "quality": 0.8,
  "width": 1920,
  "height": 1080
}

// 导出为 PDF
POST /api/export/pdf
{
  "templateId": "123",
  "orientation": "landscape" // landscape, portrait
}
```

#### 3.2 HTML 静态页面生成

```javascript
// 生成静态 HTML
POST /api/export/html
{
  "templateId": "123",
  "cdn": "bootcdn", // 选择 CDN
  "minify": true
}

// 返回打包后的 zip 文件
```

### 4. 实时协作功能

#### 4.1 WebSocket 协作

```javascript
// WebSocket 连接
ws://your-domain/ws/template/:id

// 消息格式
{
  "type": "component-update", // component-add, component-delete, etc.
  "userId": "123",
  "data": {
    "componentId": "comp-1",
    "changes": { x: 100, y: 200 }
  }
}
```

#### 4.2 冲突处理

实现操作转换（OT）或 CRDT 算法处理并发编辑冲突。

### 5. 组件市场

#### 5.1 组件发布

```javascript
// 发布组件到市场
POST /api/marketplace/components
{
  "name": "销售漏斗图",
  "description": "...",
  "code": "...", // Vue 组件代码
  "thumbnail": "...",
  "category": "chart",
  "price": 0 // 0表示免费
}
```

#### 5.2 组件安装

```javascript
// 浏览组件市场
GET /api/marketplace/components?category=chart

// 安装组件
POST /api/marketplace/install/:id
```

### 6. 数据分析

#### 6.1 使用统计

```javascript
// 记录模板使用
POST /api/analytics/usage
{
  "templateId": "123",
  "action": "view", // view, edit, export
  "duration": 300 // 秒
}

// 获取统计
GET /api/analytics/templates/:id
```

#### 6.2 热力图分析

记录用户在编辑器中的操作行为，用于产品优化。

### 7. 版本控制

#### 7.1 模板版本管理

```javascript
// 保存版本
POST /api/templates/:id/versions
{
  "message": "修改了标题颜色",
  "components": [...]
}

// 版本列表
GET /api/templates/:id/versions

// 回滚到指定版本
POST /api/templates/:id/rollback
{
  "versionId": "v-123"
}
```

### 8. 定时任务与自动化

#### 8.1 定时数据刷新

```javascript
// 配置定时刷新
POST /api/templates/:id/schedule
{
  "interval": 60, // 秒
  "dataSourceId": "ds-123"
}
```

#### 8.2 自动截图

定时生成预览图，用于缩略图展示。

### 9. 移动端适配

#### 9.1 移动端编辑器

开发简化版移动端编辑器，支持基础编辑功能。

#### 9.2 响应式预览

在移动设备上自动适配显示。

### 10. 国际化支持

#### 10.1 多语言

```javascript
// 切换语言
POST /api/user/settings
{
  "language": "en-US" // zh-CN, en-US, ja-JP
}
```

#### 10.2 组件文本翻译

支持组件内文本的多语言配置。

---

## 📡 API 接口设计

### 完整 RESTful API 规范

```
基础路径: /api/v1

认证接口:
POST   /auth/login           # 登录
POST   /auth/logout          # 登出
POST   /auth/refresh         # 刷新 Token

模板接口:
GET    /templates            # 获取模板列表
POST   /templates            # 创建模板
GET    /templates/:id        # 获取模板详情
PUT    /templates/:id        # 更新模板
DELETE /templates/:id        # 删除模板
POST   /templates/:id/clone  # 克隆模板
POST   /templates/:id/publish # 发布模板

数据源接口:
GET    /datasources          # 获取数据源列表
POST   /datasources          # 创建数据源
GET    /datasources/:id      # 获取数据源详情
PUT    /datasources/:id      # 更新数据源
DELETE /datasources/:id      # 删除数据源
POST   /datasources/:id/test # 测试数据源

数据代理:
POST   /proxy/fetch          # 代理数据请求

组件市场:
GET    /marketplace/components # 组件列表
GET    /marketplace/components/:id # 组件详情
POST   /marketplace/install/:id # 安装组件

资源管理:
POST   /upload               # 上传文件
GET    /resources            # 资源列表
DELETE /resources/:id        # 删除资源

导出功能:
POST   /export/image         # 导出图片
POST   /export/pdf           # 导出 PDF
POST   /export/html          # 导出 HTML
POST   /export/code          # 导出代码

统计分析:
GET    /analytics/overview   # 总览
GET    /analytics/templates/:id # 模板统计
POST   /analytics/events     # 记录事件
```

### 数据库表设计

#### templates 表

```sql
CREATE TABLE templates (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail TEXT,
  components JSON NOT NULL,
  config JSON,
  is_public BOOLEAN DEFAULT FALSE,
  tags JSON,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

#### datasources 表

```sql
CREATE TABLE datasources (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('api', 'mock', 'websocket') NOT NULL,
  config JSON NOT NULL,
  cache_enabled BOOLEAN DEFAULT TRUE,
  cache_duration INT DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### template_versions 表

```sql
CREATE TABLE template_versions (
  id VARCHAR(36) PRIMARY KEY,
  template_id VARCHAR(36) NOT NULL,
  version_number INT NOT NULL,
  message TEXT,
  components JSON NOT NULL,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  INDEX idx_template_id (template_id)
);
```

---

## ⚠️ 注意事项

### 1. 性能优化

#### 1.1 大量组件场景

- 使用虚拟滚动优化组件列表
- 实现组件懒加载
- 限制画布组件数量（建议 < 100）

#### 1.2 数据更新频率

- 实现数据防抖和节流
- 避免高频更新 DOM
- 使用 Web Worker 处理复杂计算

### 2. 安全性

#### 2.1 XSS 防护

- 对用户输入进行严格过滤
- 使用 `v-html` 时要特别小心
- 实现 CSP（Content Security Policy）

#### 2.2 数据源安全

- 后端代理所有数据请求
- 验证数据源 URL 合法性
- 实现请求频率限制

#### 2.3 权限控制

- 模板访问权限验证
- API 接口鉴权
- 敏感操作二次确认

### 3. 兼容性

#### 3.1 浏览器兼容

- 现代浏览器：Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- 不支持 IE 11

#### 3.2 屏幕适配

- 编辑器：推荐 1920×1080 及以上分辨率
- 预览：支持各种分辨率自适应

### 4. 部署建议

#### 4.1 前端部署

```bash
# 构建生产版本
npm run build

# 部署到 CDN 或静态服务器
# dist/ 目录包含所有静态资源
```

#### 4.2 后端部署

- 建议使用 Node.js + Express/Koa
- 或 Java Spring Boot
- 或 Python Django/Flask
- 配置 Redis 缓存数据源结果

#### 4.3 数据库选择

- MySQL/PostgreSQL：存储模板和配置
- MongoDB：存储 JSON 配置（可选）
- Redis：缓存和会话管理

### 5. 监控与日志

#### 5.1 错误监控

```javascript
// 集成 Sentry
import * as Sentry from "@sentry/vue";

Sentry.init({
  app,
  dsn: "your-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

#### 5.2 性能监控

- 监控页面加载时间
- 追踪 API 响应时间
- 记录组件渲染性能

### 6. 开发调试

#### 6.1 开发环境配置

```javascript
// .env.development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENABLE_MOCK=true
```

#### 6.2 调试工具

- Vue DevTools
- Redux DevTools (for Pinia)
- Network 面板监控 API

---

## 🎓 学习资源

### 官方文档

- [Vue 3 文档](https://vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [ECharts 文档](https://echarts.apache.org/)

### 参考项目

- [GoView](https://github.com/dromara/go-view) - 低代码数据可视化
- [DataV](http://datav.jiaminghi.com/) - Vue 大屏组件库
- [AJ-Report](https://github.com/anji-plus/report) - 开源数据可视化

---

## 📞 技术支持

如果在集成过程中遇到问题，可以：

1. 查看项目 README.md
2. 阅读源码注释
3. 提交 Issue
4. 联系开发团队

---

## 📝 更新日志

### v1.0.0 (2026-01-14)

- ✅ 完成核心编辑器功能
- ✅ 支持基础组件库
- ✅ 实现数据源管理
- ✅ 添加模板保存/加载
- ✅ 支持多主题切换
- ✅ 实现撤销/重做功能

### 待开发功能

- [ ] 后端 API 服务
- [ ] 实时协作功能
- [ ] 组件市场
- [ ] 移动端适配
- [ ] 版本控制系统

---

## 📄 License

MIT License

---

**最后更新时间：** 2026-01-14
