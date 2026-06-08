# Personal Blob

个人博客站点 — Nuxt 4 前端 + Express API 后端。

## 项目结构

```
├── frontend/        Nuxt 4 前端（纯展示）
├── backend/         Express + SQLite API
├── docker-compose.yml
└── .github/workflows/docker-build.yml
```

## 本地开发

### 前置要求

- Node.js >= 22
- 两个终端分别启动前后端

### 启动

```bash
# 1. 后端 API
cd backend
cp .env.example .env     # 编辑配置
node src/db/seed.js       # 首次：导入现有内容到数据库
node src/index.js         # → http://localhost:3001

# 2. 前端
cd frontend
npm install
npx nuxt dev              # → http://localhost:3000
```

或一键启动：

```bash
npm run dev
```

### 环境变量

**backend/.env**

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | API 端口 | `3001` |
| `APP_ENV` | 环境标识 (`development` / `production`) | `development` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret | - |
| `JWT_SECRET` | JWT 签名密钥 | - |
| `FRONTEND_URL` | 前端地址 | `http://localhost:3000` |

**frontend/.env**

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NUXT_PUBLIC_API_BASE_URL` | API 地址 | `http://localhost:3001` |
| `NUXT_PUBLIC_APP_ENV` | 环境标识 | `development` |

> `APP_ENV=development` 时跳过 GitHub OAuth 认证，方便本地开发。
> 设为 `production` 则开启完整认证。

### 管理员设置

```bash
# 将你的 GitHub ID 加入管理员白名单
cd backend && node -e "
import { getDb } from './src/db/index.js';
const db = getDb();
db.prepare('INSERT OR IGNORE INTO admins (github_id, github_login) VALUES (?, ?)').run(你的GitHub数字ID, '你的用户名');
"
```

## Docker 部署

### 构建镜像

```bash
# 后端
docker build -t personal-blob-backend -f backend/Dockerfile backend/

# 前端
docker build -t personal-blob-frontend -f frontend/Dockerfile frontend/
```

### docker-compose 启动

```bash
# 生产环境
APP_ENV=production \
GITHUB_CLIENT_ID=xxx \
GITHUB_CLIENT_SECRET=xxx \
JWT_SECRET=xxx \
docker compose up -d
```

```bash
# 开发环境（跳过认证）
APP_ENV=development docker compose up -d
```

### 拉取远程镜像部署

镜像构建后自动推送到 GitHub Container Registry：

```bash
# 拉取并启动
docker pull ghcr.io/<你的用户名>/personal-blob-backend:latest
docker pull ghcr.io/<你的用户名>/personal-blob-frontend:latest

# 或使用 docker compose
docker compose up -d
```

## GitHub Actions

每次推送到 `main` 分支或打 `v*` 标签时，自动构建并推送 Docker 镜像到 `ghcr.io`。

需要配置的 Secrets（在 GitHub 仓库 Settings → Secrets and variables → Actions 中）：

| Secret | 说明 |
|--------|------|
| 无需配置 | 使用 `GITHUB_TOKEN` 自动认证 |

生成镜像标签：

| 触发条件 | 标签 |
|----------|------|
| push main | `latest`, `main`, `sha-<commit>` |
| push tag v1.0.0 | `1.0.0`, `v1.0.0` |
| PR | `pr-<number>` |

## API 文档

| Method | Endpoint | 说明 | 认证 |
|--------|----------|------|------|
| GET | `/api/articles` | 文章列表 | - |
| GET | `/api/articles/:slug` | 单篇文章 | - |
| POST | `/api/articles` | 创建文章 | ✅ |
| PUT | `/api/articles/:id` | 更新文章 | ✅ |
| DELETE | `/api/articles/:id` | 删除文章 | ✅ |
| GET | `/api/projects` | 项目列表 | - |
| GET | `/api/projects/:id` | 单个项目 | - |
| POST | `/api/projects` | 创建项目 | ✅ |
| PUT | `/api/projects/:id` | 更新项目 | ✅ |
| DELETE | `/api/projects/:id` | 删除项目 | ✅ |
| POST | `/api/upload` | 上传图片 | ✅ |
| GET | `/api/auth/github` | GitHub OAuth 登录 | - |
| GET | `/api/auth/me` | 当前用户 | ✅ |
