# BrickScreen Backend

企业级 v2 后端基座，位于 `backend/`，使用 NestJS、Prisma、PostgreSQL。

## 常用命令

```bash
npm install
npm run db:create
npm run prisma:generate
npm run db:push
npm run build
npm run start
```

## Docker 一体化启动

后端已经可以和 PostgreSQL、Redis、MinIO 一起通过 Docker Compose 启动：

```bash
cd backend
docker compose up -d --build
```

Compose 会构建 `brickscreen-backend:latest` 镜像，并只向宿主机暴露后端端口：

- 后端：`http://localhost:3010/api`
- Swagger：`http://localhost:3010/api/docs`

PostgreSQL、Redis、MinIO 不再映射宿主机端口，后端容器通过 Compose 内部网络访问：

- PostgreSQL：`postgres:5432`
- Redis：`redis:6379`
- MinIO：`minio:9000`

首次启动空数据库后仍需初始化 Prisma schema：

```bash
docker compose --profile tools run --rm db-push
```

## 本地服务

- API 前缀：`/api`
- Swagger：`/api/docs`
- 健康检查：`GET /api/health`
- 数据库检查：`GET /api/health/database`
- Redis 检查：`GET /api/health/redis`

端口读取 `backend/.env` 中的 `PORT`，当前本地环境为 `3010`。

## 当前 API

Auth：

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Workspace：

- `GET /api/workspaces`

`register` 会自动创建默认 Workspace，并将注册用户设置为 `OWNER`。

Project：

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/restore`
- `POST /api/projects/:id/duplicate`

## 数据库

本地直接运行后端时，`backend/.env` 中的 `DATABASE_URL` 指向 PostgreSQL。首次启动前执行：

```bash
npm run db:create
npm run db:push
```

`db:create` 会根据 `DATABASE_URL` 自动创建目标数据库，例如 `easyscreen`。

## Redis

默认连接 `redis://localhost:6379`。如果本地只有镜像但容器未启动，可执行：

```bash
docker run -d --name brickscreen-redis -p 6379:6379 redis:latest
```

如果容器已存在但停止：

```bash
docker start brickscreen-redis
```
