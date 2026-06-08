# 管理后台 + 前后端分离设计文档

## 概述

为 Personal Blob 站点增加管理后台功能（写文章、上传项目），同时重构为前后端分离架构：前端 Nuxt 纯展示，后端 Express + SQLite 提供 REST API。

## 项目结构

```
d:\project\personal blob\
├── frontend/                  # Nuxt 4 前端（现有代码移入）
│   ├── app/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── login.vue           # GitHub OAuth 登录
│   │   │   │   ├── index.vue           # 仪表盘
│   │   │   │   ├── articles.vue        # 文章管理列表
│   │   │   │   ├── articles/new.vue    # 写文章（CodeMirror 编辑器）
│   │   │   │   ├── articles/[id].vue   # 编辑文章
│   │   │   │   ├── projects.vue        # 项目管理列表
│   │   │   │   ├── projects/new.vue    # 新建项目
│   │   │   │   └── projects/[id].vue   # 编辑项目
│   │   │   └── (原有公开页面保持不变)
│   │   ├── layouts/
│   │   │   └── admin.vue               # 后台布局（侧边栏）
│   │   ├── components/
│   │   │   ├── AdminSidebar.vue
│   │   │   └── MarkdownEditor.vue
│   │   └── composables/
│   │       └── useApi.ts               # 封装 API 调用（含 JWT）
│   ├── nuxt.config.ts
│   ├── app.config.ts
│   └── package.json
│
├── backend/                   # Express + SQLite 后端
│   ├── src/
│   │   ├── index.js           # 服务入口
│   │   ├── config.js          # GitHub OAuth 配置
│   │   ├── db/
│   │   │   ├── schema.sql     # 建表语句
│   │   │   └── index.js       # SQLite 连接 & 初始化
│   │   ├── routes/
│   │   │   ├── auth.js        # GitHub OAuth 登录
│   │   │   ├── articles.js    # 文章 CRUD
│   │   │   ├── projects.js    # 项目 CRUD
│   │   │   └── upload.js      # 文件上传
│   │   └── middleware/
│   │       └── auth.js        # JWT 鉴权中间件
│   ├── uploads/               # 上传文件目录
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 前端框架 | Nuxt 4 + Vue 3 + TypeScript | 现有项目升级 |
| HTTP 客户端 | `ofetch` | Nuxt 内置 |
| 后端框架 | Express | REST API |
| 数据库 | SQLite (`better-sqlite3`) | 单文件数据库 |
| 认证 | GitHub OAuth App + JWT | jsonwebtoken |
| 文件上传 | Multer | 图片存储 |
| Markdown 编辑器 | CodeMirror 6 | 语法高亮 + 实时预览 |
| Markdown 渲染 | `markdown-it` | 前后端通用 |

## 数据库设计

### articles 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| slug | TEXT UNIQUE | URL 标识 |
| title | TEXT NOT NULL | 标题 |
| excerpt | TEXT NOT NULL | 摘要 |
| content | TEXT NOT NULL | Markdown 正文 |
| tags | TEXT DEFAULT '[]' | JSON 数组 |
| cover_image | TEXT | 封面图 URL |
| published | BOOLEAN DEFAULT 0 | 发布状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### projects 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| title | TEXT NOT NULL | 标题 |
| excerpt | TEXT NOT NULL | 摘要 |
| content | TEXT | Markdown 正文（可选） |
| tags | TEXT DEFAULT '[]' | JSON 数组 |
| cover_image | TEXT | 封面图 URL |
| url | TEXT | 项目外部链接 |
| published | BOOLEAN DEFAULT 0 | 发布状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### admins 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| github_id | INTEGER UNIQUE | GitHub 用户 ID |
| github_login | TEXT NOT NULL | GitHub 用户名 |
| role | TEXT DEFAULT 'admin' | 角色 |

## API 设计

### 认证

| Method | Endpoint | 说明 | Auth |
|--------|----------|------|------|
| GET | /api/auth/github | 跳转 GitHub OAuth 授权页 | - |
| GET | /api/auth/callback | OAuth 回调，验证后签发 JWT | - |
| GET | /api/auth/me | 获取当前登录用户信息 | ✅ |

### 文章 (Articles)

| Method | Endpoint | 说明 | Auth |
|--------|----------|------|------|
| GET | /api/articles | 获取文章列表（支持分页、筛选） | - |
| GET | /api/articles/:slug | 获取单篇文章 | - |
| POST | /api/articles | 创建文章 | ✅ |
| PUT | /api/articles/:id | 更新文章 | ✅ |
| DELETE | /api/articles/:id | 删除文章 | ✅ |

### 项目 (Projects)

| Method | Endpoint | 说明 | Auth |
|--------|----------|------|------|
| GET | /api/projects | 获取项目列表 | - |
| GET | /api/projects/:id | 获取单个项目 | - |
| POST | /api/projects | 创建项目 | ✅ |
| PUT | /api/projects/:id | 更新项目 | ✅ |
| DELETE | /api/projects/:id | 删除项目 | ✅ |

### 文件上传

| Method | Endpoint | 说明 | Auth |
|--------|----------|------|------|
| POST | /api/upload | 上传图片（返回 URL） | ✅ |

### 通用响应格式

```json
// 成功
{ "data": { ... } }

// 列表
{ "data": [...], "total": 10, "page": 1, "per_page": 20 }

// 错误
{ "error": { "code": "NOT_FOUND", "message": "Article not found" } }
```

## 认证流程

1. 用户访问 `/admin/login`，点击 "Login with GitHub"
2. 跳转到 `https://github.com/login/oauth/authorize?client_id=...`
3. 用户授权后，GitHub 回调 `/api/auth/callback?code=...`
4. 后端用 code 换取 access_token，再获取 GitHub 用户信息
5. 查询 `admins` 表：若该 GitHub ID 在白名单中，签发 JWT
6. 前端收到 JWT，存入 localStorage，跳转 `/admin`
7. 所有写操作请求头携带 `Authorization: Bearer <jwt>`

## 前端管理后台设计

### 布局

- 使用独立的 `admin.vue` layout
- 左侧固定宽度侧边栏，右侧内容区
- 侧边栏包含：Logo、导航链接（仪表盘/文章/项目）、用户信息、退出按钮

### 页面

**/admin/login** — GitHub 登录页
- 居中卡片，大按钮 "Login with GitHub"
- 登录后自动跳转 /admin

**/admin/index** — 仪表盘
- 欢迎信息 + GitHub 用户头像
- 统计卡片：文章总数 / 已发布数 / 项目总数
- 最近编辑的文章和项目列表
- 快捷按钮："写新文章"、"添加项目"

**/admin/articles** — 文章管理列表
- 表格显示：标题、状态、日期、操作
- 搜索过滤、状态筛选
- 操作按钮：编辑、删除、切换发布/草稿

**/admin/articles/new** — 写文章
- Markdown 编辑器（CodeMirror 6）
- 标题、Slug（自动生成可编辑）、摘要、标签、封面图
- 发布/保存草稿按钮
- 实时预览

**/admin/projects** — 项目管理列表
- 类似文章管理列表

**/admin/projects/new** — 新建/编辑项目
- 标题、摘要、正文（Markdown，可选）、标签、封面图、外部链接
- 发布/保存草稿按钮

### 组件

- **AdminSidebar.vue** — 侧边栏导航组件
- **MarkdownEditor.vue** — 基于 CodeMirror 6 的 Markdown 编辑器组件，含实时预览

### Composables

- **useApi.ts** — 封装 API 调用
  - `useApi().get('/articles')` 自动携带 JWT
  - `useApi().post('/articles', data)`
  - 自动处理 401 跳转登录

## 数据流

```
[用户浏览器]
    │
    ├─ 公开页面 ──→ Nuxt (SSR/CSR) ──fetch──→ Express API ──→ SQLite
    │                                                 └─→ uploads/
    └─ 管理页面 ──→ Nuxt (CSR) ──fetch(JWT)──→ Express API ──→ SQLite
                                                          └─→ uploads/
```

- 公开页面：无论 SSR 还是客户端渲染，都通过 API 获取内容
- 管理页面：仅客户端渲染（CSR），先登录获取 JWT，所有写操作需要 JWT

## 设计要点

- **视觉统一**：管理后台复用主站的 CSS tokens、字体、色彩系统，保持 Bauhaus 风格
- **侧边栏导航**：仪表盘 / 文章管理 / 项目管理，当前页面高亮
- **GitHub OAuth**：管理员白名单在后端 `admins` 表中配置，初始管理员通过命令行或直接 SQL 插入
- **CodeMirror 6**：Markdown 语法高亮、括号匹配、快捷键（Ctrl+B 加粗等），右侧实时预览
- **图片上传**：拖拽或选择文件 → POST /api/upload → 返回 URL → 自动插入 Markdown 编辑器
- **安全性**：生产环境需配置 CORS、Helmet、速率限制；JWT 设置过期时间
