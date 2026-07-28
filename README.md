# 开箱即用、一键部署的 2D / GIS / 3D 低代码可视化平台

BrickScreen 是一个面向数据大屏、数字孪生与企业可视化场景的低代码编辑平台。项目以 Vue 3、ECharts、Cesium 和 Three.js 提供统一的可视化画布，并通过 NestJS、Prisma、PostgreSQL、Redis 与 MinIO 提供用户认证、工作区、项目、资产、版本和发布等后端能力。

平台采用前后端分离架构，可用于搭建运营看板、设备监控、园区 GIS、三维场景、网络运维大屏和多媒体展示页面。用户可以从工作区创建项目，在编辑器中拖拽组件、配置数据和交互，保存草稿并生成可访问的预览或分享页面。
![Image text](https://baas.nicowebgl.cn/storage/v1/object/public/images/lowcode2d/image1.png)
![Image text](https://baas.nicowebgl.cn/storage/v1/object/public/images/lowcode2d/image2.png)
![Image text](https://baas.nicowebgl.cn/storage/v1/object/public/images/lowcode2d/image3.png)
## 项目简介

BrickScreen 将传统 2D 数据组件、Cesium 地理场景和 Three.js Web 3D 内容放在同一套编辑器工作流中。编辑器负责多页面编排、图层管理、属性配置、数据接入和预览交付；后端负责业务数据持久化、权限校验、文件存储以及版本发布。

核心能力：

- 可视化编辑：支持组件拖拽、缩放、图层排序、锁定、隐藏、复制粘贴、撤销重做和网格吸附。
- 多类型组件：内置 ECharts 图表、表格、指标卡、图片、HLS/FLV 视频、导航、交互按钮等组件，并提供面向资产、设备、告警、主机、流量等场景的业务组件。
- GIS 与 Web 3D：在画布中编排 Cesium 和 Three.js 场景，并配置 Cesium 事件、拾取和交互动作。
- 多页面项目：支持项目页面管理、页面间导航、独立预览和 1920 x 1080 设计稿等比例适配。
- 数据接入与处理：支持资源中心、数据源配置、接口调试、字段映射、过滤、排序、聚合、格式化和 JavaScript 转换脚本。
- 工作区管理：提供注册登录、我的项目、最近打开、收藏、模板市场、资源、数据源、资产和回收站入口。
- 项目交付：支持自动保存、快照、版本、回滚、发布、模板分享、Fork 以及 JSON / Vue 项目导出。
- 封面与资产：可将当前编辑页面截图设为项目封面，截图包含普通 DOM、Cesium 与 Three.js 场景；项目封面独立存储，不会进入资产中心。
- 企业后端：基于 JWT、Refresh Token、Casbin 权限策略、审计日志、统一异常响应、请求限流和 Swagger 构建。
- 独立文件存储：资产中心仅管理用户主动上传的文件，文件存入 MinIO；项目元数据和模板分享数据存入 PostgreSQL，不直接依赖 Supabase。
- 暗黑工作台：默认使用适合长时间编辑和大屏制作的暗黑主题，同时保留主题切换能力。

## 技术栈

- 前端：Vue 3、Vite、Pinia、Vue Router、Element Plus、Moveable、Monaco Editor
- 可视化：ECharts、ECharts LiquidFill、Cesium、Three.js、HLS.js、flv.js
- 后端：NestJS、Prisma ORM、PostgreSQL、Redis、MinIO
- 安全与权限：JWT、Passport、Casbin、Helmet、接口限流
- 工程化：npm、TypeScript、Swagger、Docker、Docker Compose

## 目录结构

```text
.
├── src/
│   ├── api/                   # 前端 API 封装
│   ├── bricks/                # 画布基础组件与可视化组件
│   ├── business/              # 可复用业务组件配置
│   ├── cesium-interaction/    # Cesium 事件、规则与动作系统
│   ├── components/            # 编辑器、工作区与配置面板
│   ├── composables/           # 数据、事件、样式和屏幕适配逻辑
│   ├── router/                # 工作区、编辑器、预览和分享路由
│   ├── stores/                # Pinia 状态管理
│   ├── templates/             # 内置页面模板
│   ├── views/                 # 页面级视图
│   └── visual/                # Cesium 与 Three.js 场景实现
├── backend/
│   ├── prisma/                # Prisma 数据模型
│   ├── scripts/               # 数据库创建与后端冒烟测试
│   ├── src/modules/           # Auth、Project、Asset、Publish 等模块
│   ├── docker-compose.yml     # 后端及基础设施编排
│   └── Dockerfile             # NestJS 多阶段构建镜像
├── tests/                     # 前端逻辑回归测试
├── readme/                    # 架构与集成文档
├── roadmap/                   # 产品路线与部署说明
├── package.json               # 前端依赖和命令
└── vite.config.js             # Vite、Cesium 与 API 代理配置
```

## 环境要求

- Node.js >= 20
- npm >= 10
- Docker 与 Docker Compose，用于启动完整后端环境
- 如不使用 Docker，需要自行准备 PostgreSQL、Redis 与 MinIO

## 快速开始

推荐使用 Docker 启动后端及基础设施，在本地启动 Vite 前端。

### 1. 安装前端依赖

```bash
npm install
```

### 2. 启动后端服务

```bash
cd backend
docker compose up -d --build
```

首次启动空数据库后，初始化 Prisma schema：

```bash
docker compose --profile tools run --rm db-push
```

后端默认地址：

- API：`http://localhost:3010/api`
- Swagger：`http://localhost:3010/api/docs`
- 健康检查：`http://localhost:3010/api/health`

### 3. 启动前端

回到项目根目录：

```bash
npm run dev
```

打开 `http://localhost:5173`。开发服务器会将 `/api` 请求代理到 `http://localhost:3010`。

### 4. 创建账号

首次访问会进入登录页。选择“创建一个工作区”，完成注册后系统会自动创建默认 Workspace，并将注册用户设置为该工作区的 `OWNER`。

## 本地运行后端

需要调试 NestJS 源码时，可以直接运行后端。开始前请确保 PostgreSQL、Redis 和 MinIO 已通过宿主机端口访问。

```bash
cd backend
npm install
cp .env.example .env
```

将 `backend/.env` 中的 `PORT` 修改为 `3010`，并根据本机环境配置 `DATABASE_URL`、`REDIS_URL` 和 MinIO 连接信息，然后执行：

```bash
npm run db:create
npm run prisma:generate
npm run db:push
npm run dev
```

## Docker 部署后端

`backend/docker-compose.yml` 会构建 NestJS 后端，并启动 PostgreSQL 16、Redis 7 与 MinIO：

```bash
cd backend
docker compose up -d --build
docker compose --profile tools run --rm db-push
```

Compose 只向宿主机暴露后端端口，PostgreSQL、Redis 和 MinIO 通过内部 Docker 网络通信。默认映射为 `3010:3000`，可通过 `BACKEND_PORT` 修改宿主机端口。

数据分别持久化到以下目录：

```text
backend/postgres_data
backend/redis_data
backend/minio_data
```

生产环境至少应覆盖以下变量：

```env
CREDENTIAL_SECRET=replace-with-a-long-random-secret
FRONTEND_ORIGIN=https://your-editor-domain.com
BACKEND_PORT=3010
ASSET_PUBLIC_BASE_URL=/api/assets/public
```

常用环境变量：

| 变量 | 说明 | 开发默认值 |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL 连接地址 | `postgresql://postgres:postgres@localhost:5432/easyscreen?schema=public` |
| `CREDENTIAL_SECRET` | JWT 与凭据签名密钥，生产环境必须修改 | 示例占位值 |
| `PORT` | NestJS 监听端口 | `3000` |
| `FRONTEND_ORIGIN` | 允许跨域访问 API 的前端地址，多个地址用逗号分隔 | `http://localhost:5173` |
| `REDIS_URL` | Redis 连接地址 | `redis://localhost:6379` |
| `MINIO_ENDPOINT` | MinIO 服务地址 | `localhost` |
| `MINIO_PORT` | MinIO API 端口 | `9000` |
| `MINIO_BUCKET` | 资产存储桶 | `brickscreen` |
| `ASSET_PUBLIC_BASE_URL` | 公开资产代理前缀 | `/api/assets/public` |

完整示例见 `backend/.env.example`。

## 部署前端

构建生产版本：

```bash
npm run build
```

构建产物位于根目录 `dist/`，可部署到 Nginx、静态资源服务器或对象存储。生产环境默认使用 `/api` 作为接口前缀，建议由同域 Nginx 反向代理到后端：

```nginx
server {
    listen 80;
    server_name your-editor-domain.com;

    root /var/www/brickscreen;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3010/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 常用命令

前端命令：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 本地预览生产构建 |

后端命令需要在 `backend/` 目录执行：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 以监听模式启动 NestJS |
| `npm run build` | 构建后端 |
| `npm run start` | 启动已构建的后端 |
| `npm run db:create` | 根据 `DATABASE_URL` 创建数据库 |
| `npm run db:push` | 将 Prisma schema 同步到数据库 |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:studio` | 打开 Prisma Studio |
| `npm test` | 运行后端 Jest 测试 |
| `npm run test:phase8` | 运行后端业务冒烟测试 |

## 后端 API 概览

后端统一使用 `/api` 前缀，并通过 Swagger 提供完整接口说明。主要接口分组：

- `/api/auth`：注册、登录、刷新 Token、登出和当前用户信息。
- `/api/workspaces`：工作区列表及成员上下文。
- `/api/projects`：项目创建、更新、复制、回收、恢复和项目封面。
- `/api/editor/projects`：编辑器草稿、自动保存和快照。
- `/api/assets`：工作区资产上传、查询、更新和删除。
- `/api/resources`：REST、GraphQL、数据库、OpenAPI 等资源配置与连通性测试。
- `/api/datasources`：项目数据源管理与请求测试。
- `/api/versions`：版本创建、查询和回滚。
- `/api/publishes`：发布记录和发布状态管理。
- `/api/marketplace`：市场内容、评论、点赞和 Fork。
- `/api/templates`：基于哈希的模板保存与公开读取。
- `/api/access-control`：工作区权限策略管理。
- `/api/audit-logs`：审计日志查询。
- `/api/notifications`：通知列表和已读状态。
- `/api/health`：后端、PostgreSQL 和 Redis 健康检查。

## 数据与存储说明

- PostgreSQL 保存用户、工作区、项目、页面、编辑器 schema、快照、版本、发布、模板和资产元数据。
- Redis 用于保存刷新令牌等认证运行时状态。
- MinIO 保存用户上传的资产文件和项目封面文件。
- 项目封面通过独立接口上传并写入项目 `coverUrl`，不会创建资产中心记录。
- 资产中心仅接受用户主动上传的图片、JSON、视频、音频、字体和文本文件，单文件上限为 50 MB。
- 模板分享通过 NestJS `/api/templates` 接口访问 PostgreSQL，不需要前端配置 Supabase SDK 或密钥。

## 生产部署建议

- 使用足够强度的随机值替换 `CREDENTIAL_SECRET`，并妥善管理环境变量。
- 将 `FRONTEND_ORIGIN` 限制为真实前端域名，并使用 HTTPS 暴露前端与 API。
- 修改 PostgreSQL、Redis 和 MinIO 的默认账号及密码，不要直接使用 Compose 示例值。
- 对 `backend/postgres_data`、`backend/redis_data` 和 `backend/minio_data` 制定备份与恢复策略。
- 为上传接口配置网关层文件大小、超时和访问频率限制。
- 部署后检查 `/api/health`、`/api/health/database`、`/api/health/redis` 和 Swagger 文档。

## 许可

当前仓库未声明开源许可证。如需商业使用、二次分发或对外发布，请先确认项目授权方式。
