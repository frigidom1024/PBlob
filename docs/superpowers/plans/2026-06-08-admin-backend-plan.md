# 管理后台 + 前后端分离 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 Personal Blob 为 frontend/ + backend/ 独立项目，实现管理后台（写文章、上传项目）

**Architecture:** Nuxt 4 前端纯展示，Express + SQLite 后端提供 REST API。GitHub OAuth 登录保护后台，CodeMirror 6 作为 Markdown 编辑器。

**Tech Stack:** Nuxt 4 / Vue 3 / Express / SQLite (better-sqlite3) / GitHub OAuth / JWT / CodeMirror 6 / markdown-it / Multer

---

### Task 1: 创建 Backend 项目结构

**Files:**
- Create: `d:\project\personal blob\backend\package.json`
- Create: `d:\project\personal blob\backend\.env.example`
- Create: `d:\project\personal blob\backend\uploads\.gitkeep`

- [ ] **Step 1: 创建 backend/package.json**

```json
{
  "name": "personal-blob-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "seed": "node src/db/seed.js"
  },
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.4.5"
  }
}
```

- [ ] **Step 2: 创建 .env.example**

```env
PORT=3001
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_jwt_secret_change_this
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 3: 安装依赖**

Run: `cd d:/project/personal\ blob/backend && npm install`

- [ ] **Step 4: 创建 uploads 占位文件**

Run: `echo "" > d:/project/personal\ blob/backend/uploads/.gitkeep`

---

### Task 2: 数据库层（Schema + 连接）

**Files:**
- Create: `d:\project\personal blob\backend\src\db\schema.sql`
- Create: `d:\project\personal blob\backend\src\db\index.js`
- Create: `d:\project\personal blob\backend\src\db\seed.js`

- [ ] **Step 1: 创建 schema.sql**

```sql
CREATE TABLE IF NOT EXISTS articles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  excerpt       TEXT NOT NULL DEFAULT '',
  content       TEXT NOT NULL DEFAULT '',
  tags          TEXT NOT NULL DEFAULT '[]',
  cover_image   TEXT,
  published     INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME DEFAULT (datetime('now')),
  updated_at    DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  excerpt       TEXT NOT NULL DEFAULT '',
  content       TEXT DEFAULT '',
  tags          TEXT NOT NULL DEFAULT '[]',
  cover_image   TEXT,
  url           TEXT,
  published     INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME DEFAULT (datetime('now')),
  updated_at    DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id     INTEGER UNIQUE NOT NULL,
  github_login  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    DATETIME DEFAULT (datetime('now'))
);
```

- [ ] **Step 2: 创建 db/index.js**

```js
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '..', '..', 'data.db')

let db

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
    db.exec(schema)
  }
  return db
}
```

- [ ] **Step 3: 创建 seed.js（迁移现有 Markdown 内容到数据库）**

```js
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from './index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return null
  const frontmatter = {}
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/)
    if (kv) {
      let val = kv[2].trim()
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      if (val.startsWith('[')) val = JSON.parse(val.replace(/'/g, '"'))
      frontmatter[kv[1]] = val
    }
  }
  return { frontmatter, body: match[2].trim() }
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const CONTENT_DIR = join(__dirname, '..', '..', '..', 'content')

function seedArticles() {
  const db = getDb()
  const dir = join(CONTENT_DIR, 'articles')
  let files
  try { files = readdirSync(dir) } catch { return }

  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const raw = readFileSync(join(dir, file), 'utf-8')
    const parsed = parseFrontmatter(raw)
    if (!parsed) continue

    const { frontmatter, body } = parsed
    const slug = file.replace(/\.md$/, '')

    const existing = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug)
    if (existing) continue

    db.prepare(`
      INSERT INTO articles (slug, title, excerpt, content, tags, cover_image, published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      slug,
      frontmatter.title || slug,
      frontmatter.excerpt || '',
      body,
      JSON.stringify(frontmatter.tags || []),
      frontmatter.image || null,
      frontmatter.date || new Date().toISOString(),
      frontmatter.date || new Date().toISOString(),
    )
    console.log(`  ✅ Article: ${frontmatter.title || slug}`)
  }
}

function seedProjects() {
  const db = getDb()
  const dir = join(CONTENT_DIR, 'projects')
  let files
  try { files = readdirSync(dir) } catch { return }

  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const raw = readFileSync(join(dir, file), 'utf-8')
    const parsed = parseFrontmatter(raw)
    if (!parsed) continue

    const { frontmatter, body } = parsed

    const existing = db.prepare('SELECT id FROM projects WHERE title = ?').get(frontmatter.title)
    if (existing) continue

    db.prepare(`
      INSERT INTO projects (title, excerpt, content, tags, cover_image, url, published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      frontmatter.title,
      frontmatter.excerpt || '',
      body || '',
      JSON.stringify(frontmatter.tags || []),
      frontmatter.image || null,
      frontmatter.url || null,
      frontmatter.date || new Date().toISOString(),
      frontmatter.date || new Date().toISOString(),
    )
    console.log(`  ✅ Project: ${frontmatter.title}`)
  }
}

console.log('Seeding articles...')
seedArticles()
console.log('Seeding projects...')
seedProjects()
console.log('Done!')
```

---

### Task 3: JWT 鉴权中间件

**Files:**
- Create: `d:\project\personal blob\backend\src\middleware\auth.js`

- [ ] **Step 1: 创建 auth 中间件**

```js
import jwt from 'jsonwebtoken'

const { JWT_SECRET = 'dev-secret' } = process.env

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } })
  }

  try {
    const token = header.split(' ')[1]
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token expired or invalid' } })
  }
}
```

---

### Task 4: GitHub OAuth 认证路由

**Files:**
- Create: `d:\project\personal blob\backend\src\routes\auth.js`

- [ ] **Step 1: 创建 auth 路由**

```js
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { getDb } from '../db/index.js'

const router = Router()

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  JWT_SECRET = 'dev-secret',
  FRONTEND_URL = 'http://localhost:3000',
} = process.env

// 跳转 GitHub 授权
router.get('/github', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user`
  res.redirect(url)
})

// OAuth 回调
router.get('/callback', async (req, res) => {
  const { code } = req.query
  if (!code) {
    return res.redirect(`${FRONTEND_URL}/admin/login?error=no_code`)
  }

  try {
    // 用 code 换 access_token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    const { access_token } = await tokenRes.json()
    if (!access_token) {
      return res.redirect(`${FRONTEND_URL}/admin/login?error=token_failed`)
    }

    // 获取用户信息
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const githubUser = await userRes.json()

    // 检查白名单
    const db = getDb()
    const admin = db.prepare('SELECT * FROM admins WHERE github_id = ?').get(githubUser.id)
    if (!admin) {
      return res.redirect(`${FRONTEND_URL}/admin/login?error=not_authorized`)
    }

    // 签发 JWT
    const token = jwt.sign(
      { id: admin.id, github_id: githubUser.id, github_login: githubUser.login, avatar_url: githubUser.avatar_url },
      JWT_SECRET,
      { expiresIn: '7d' },
    )

    res.redirect(`${FRONTEND_URL}/admin?token=${token}`)
  } catch (err) {
    console.error('OAuth error:', err)
    res.redirect(`${FRONTEND_URL}/admin/login?error=server_error`)
  }
})

// 获取当前用户
router.get('/me', (req, res) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.json({ data: null })
  }
  try {
    const user = jwt.verify(header.split(' ')[1], JWT_SECRET)
    res.json({ data: user })
  } catch {
    res.json({ data: null })
  }
})

export default router
```

---

### Task 5: 文章 CRUD 路由

**Files:**
- Create: `d:\project\personal blob\backend\src\routes\articles.js`

- [ ] **Step 1: 创建 articles 路由**

```js
import { Router } from 'express'
import { getDb } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/articles — 公开文章列表
router.get('/', (req, res) => {
  const db = getDb()
  const { published, page = 1, per_page = 50 } = req.query
  const offset = (Math.max(1, Number(page)) - 1) * Number(per_page)

  let where = ''
  const params = []
  if (published === '1') {
    where = 'WHERE published = 1'
  } else if (published === '0') {
    where = 'WHERE published = 0'
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM articles ${where}`).get(...params).count

  const rows = db.prepare(`
    SELECT id, slug, title, excerpt, tags, cover_image, published, created_at, updated_at
    FROM articles ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(per_page), offset)

  const data = rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]'), date: r.created_at }))

  res.json({ data, total, page: Number(page), per_page: Number(per_page) })
})

// GET /api/articles/:slug — 单篇文章（含 content）
router.get('/:slug', (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM articles WHERE slug = ?').get(req.params.slug)
  if (!row) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Article not found' } })
  }
  res.json({ data: { ...row, tags: JSON.parse(row.tags || '[]'), date: row.created_at } })
})

// POST /api/articles — 创建文章
router.post('/', requireAuth, (req, res) => {
  const db = getDb()
  const { slug, title, excerpt, content, tags, cover_image, published } = req.body

  if (!title) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Title is required' } })
  }

  const finalSlug = slug || title.toLowerCase().replace(/[^\w一-龥]+/g, '-').replace(/^-+|-+$/g, '')

  try {
    const result = db.prepare(`
      INSERT INTO articles (slug, title, excerpt, content, tags, cover_image, published)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(finalSlug, title, excerpt || '', content || '', JSON.stringify(tags || []), cover_image || null, published ? 1 : 0)

    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ data: { ...article, tags: JSON.parse(article.tags || '[]'), date: article.created_at } })
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Slug already exists' } })
    }
    throw err
  }
})

// PUT /api/articles/:id — 更新文章
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb()
  const { title, excerpt, content, tags, cover_image, published, slug } = req.body

  const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  if (!existing) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Article not found' } })
  }

  db.prepare(`
    UPDATE articles SET title=?, slug=?, excerpt=?, content=?, tags=?, cover_image=?, published=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    title ?? existing.title,
    slug ?? existing.slug,
    excerpt ?? existing.excerpt,
    content ?? existing.content,
    JSON.stringify(tags ?? JSON.parse(existing.tags)),
    cover_image ?? existing.cover_image,
    published !== undefined ? (published ? 1 : 0) : existing.published,
    req.params.id,
  )

  const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  res.json({ data: { ...updated, tags: JSON.parse(updated.tags || '[]'), date: updated.created_at } })
})

// DELETE /api/articles/:id — 删除文章
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb()
  const result = db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Article not found' } })
  }
  res.json({ data: { id: Number(req.params.id), deleted: true } })
})

export default router
```

---

### Task 6: 项目 CRUD 路由

**Files:**
- Create: `d:\project\personal blob\backend\src\routes\projects.js`

- [ ] **Step 1: 创建 projects 路由**

```js
import { Router } from 'express'
import { getDb } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', (req, res) => {
  const db = getDb()
  const { published, page = 1, per_page = 50 } = req.query
  const offset = (Math.max(1, Number(page)) - 1) * Number(per_page)

  let where = ''
  if (published === '1') where = 'WHERE published = 1'
  else if (published === '0') where = 'WHERE published = 0'

  const total = db.prepare(`SELECT COUNT(*) as count FROM projects ${where}`).get().count

  const rows = db.prepare(`
    SELECT id, title, excerpt, tags, cover_image, url, published, created_at, updated_at
    FROM projects ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(Number(per_page), offset)

  const data = rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]'), date: r.created_at }))
  res.json({ data, total, page: Number(page), per_page: Number(per_page) })
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } })
  res.json({ data: { ...row, tags: JSON.parse(row.tags || '[]'), date: row.created_at } })
})

router.post('/', requireAuth, (req, res) => {
  const db = getDb()
  const { title, excerpt, content, tags, cover_image, url, published } = req.body

  if (!title) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Title is required' } })
  }

  const result = db.prepare(`
    INSERT INTO projects (title, excerpt, content, tags, cover_image, url, published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, excerpt || '', content || '', JSON.stringify(tags || []), cover_image || null, url || null, published ? 1 : 0)

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ data: { ...project, tags: JSON.parse(project.tags || '[]'), date: project.created_at } })
})

router.put('/:id', requireAuth, (req, res) => {
  const db = getDb()
  const { title, excerpt, content, tags, cover_image, url, published } = req.body

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } })

  db.prepare(`
    UPDATE projects SET title=?, excerpt=?, content=?, tags=?, cover_image=?, url=?, published=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    title ?? existing.title,
    excerpt ?? existing.excerpt,
    content ?? existing.content,
    JSON.stringify(tags ?? JSON.parse(existing.tags)),
    cover_image ?? existing.cover_image,
    url ?? existing.url,
    published !== undefined ? (published ? 1 : 0) : existing.published,
    req.params.id,
  )

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  res.json({ data: { ...updated, tags: JSON.parse(updated.tags || '[]'), date: updated.created_at } })
})

router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb()
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } })
  res.json({ data: { id: Number(req.params.id), deleted: true } })
})

export default router
```

---

### Task 7: 文件上传路由

**Files:**
- Create: `d:\project\personal blob\backend\src\routes\upload.js`

- [ ] **Step 1: 创建 upload 路由**

```js
import { Router } from 'express'
import multer from 'multer'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { requireAuth } from '../middleware/auth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = join(__dirname, '..', '..', 'uploads')

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  },
})

const router = Router()

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded' } })
  }
  const port = process.env.PORT || 3001
  const url = `/uploads/${req.file.filename}`
  res.json({ data: { url, filename: req.file.filename } })
})

export default router
```

---

### Task 8: Express 入口文件

**Files:**
- Create: `d:\project\personal blob\backend\src\index.js`

- [ ] **Step 1: 创建入口文件，绑定所有路由和中间件**

```js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import authRoutes from './routes/auth.js'
import articleRoutes from './routes/articles.js'
import projectRoutes from './routes/projects.js'
import uploadRoutes from './routes/upload.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }))
app.use(express.json())

// 静态文件（上传的图片）
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/upload', uploadRoutes)

// 健康检查
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } })
})

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})
```

- [ ] **Step 2: 测试后端启动**

Run: `cd d:/project/personal\ blob/backend && node src/index.js`
Expected: `API server running at http://localhost:3001`
Verify: `curl http://localhost:3001/api/health` → `{"status":"ok"}`

- [ ] **Step 3: Seed 数据**

Run: `cd d:/project/personal\ blob/backend && node src/db/seed.js`
Expected: 显示已导入的文章和项目

- [ ] **Step 4: 验证 API 返回数据**

Run: `curl http://localhost:3001/api/articles`
Expected: 返回包含文章的 JSON 数组

---

### Task 9: 重构前端项目结构

**Files:**
- Modify: `d:\project\personal blob\nuxt.config.ts` → 移到 `d:\project\personal blob\frontend\nuxt.config.ts`
- Modify: `d:\project\personal blob\package.json` → 移到 `d:\project\personal blob\frontend\package.json`
- Create: `d:\project\personal blob\frontend\.env`
- Modify: `d:\project\personal blob\frontend\tsconfig.json`（更新路径引用）

- [ ] **Step 1: 创建 frontend/ 目录并移动文件**

```bash
mkdir -p d:/project/personal\ blob/frontend
```

将以下文件/目录移动到 frontend/：
- `app/` → `frontend/app/`
- `public/` → `frontend/public/`
- `content/` → `frontend/content/`
- `nuxt.config.ts` → `frontend/nuxt.config.ts`
- `package.json` → `frontend/package.json`
- `tsconfig.json` → `frontend/tsconfig.json`
- `.gitignore` → `frontend/.gitignore`
- `README.md` → `frontend/README.md`
- `PRODUCT.md` → `frontend/PRODUCT.md`
- `DESIGN.md` → `frontend/DESIGN.md`

- [ ] **Step 2: 更新 frontend/package.json**

```json
{
  "name": "personal-blob-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview"
  },
  "dependencies": {
    "nuxt": "^4.4.7",
    "vue": "^3.5.35",
    "vue-router": "^5.1.0",
    "markdown-it": "^14.1.0",
    "codemirror": "^6.0.1",
    "@codemirror/lang-markdown": "^6.3.0",
    "@codemirror/theme-one-dark": "^6.1.0",
    "@codemirror/view": "^6.34.0",
    "@codemirror/state": "^6.5.0",
    "@codemirror/commands": "^6.7.0",
    "@codemirror/language": "^6.10.0"
  }
}
```

> **注意**：`@nuxt/content` 和 `sqlite3` 被移除，因为内容现在从 API 获取。

- [ ] **Step 3: 更新 frontend/nuxt.config.ts**

```ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 4: 创建 frontend/.env**

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

- [ ] **Step 5: 安装前端依赖**

Run: `cd d:/project/personal\ blob/frontend && npm install`

---

### Task 10: 创建 useApi Composable

**Files:**
- Create: `d:\project\personal blob\frontend\app\composables\useApi.ts`

- [ ] **Step 1: 创建 API 调用封装**

```ts
import { ofetch } from 'ofetch'

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl

  const api = ofetch.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        const token = localStorage.getItem('admin_token')
        if (token) {
          localStorage.removeItem('admin_token')
          navigateTo('/admin/login')
        }
      }
    },
  })

  function getAuthHeaders() {
    const token = localStorage.getItem('admin_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  return {
    // 公开方法（无需 token）
    async getArticles(params?: Record<string, any>) {
      return api('/api/articles', { params })
    },
    async getArticle(slug: string) {
      return api(`/api/articles/${slug}`)
    },
    async getProjects(params?: Record<string, any>) {
      return api('/api/projects', { params })
    },
    async getProject(id: number | string) {
      return api(`/api/projects/${id}`)
    },

    // 管理方法（需要 token）
    async createArticle(data: any) {
      return api('/api/articles', { method: 'POST', body: data, headers: getAuthHeaders() })
    },
    async updateArticle(id: number, data: any) {
      return api(`/api/articles/${id}`, { method: 'PUT', body: data, headers: getAuthHeaders() })
    },
    async deleteArticle(id: number) {
      return api(`/api/articles/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
    },
    async createProject(data: any) {
      return api('/api/projects', { method: 'POST', body: data, headers: getAuthHeaders() })
    },
    async updateProject(id: number, data: any) {
      return api(`/api/projects/${id}`, { method: 'PUT', body: data, headers: getAuthHeaders() })
    },
    async deleteProject(id: number) {
      return api(`/api/projects/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
    },

    // 上传
    async uploadImage(file: File) {
      const formData = new FormData()
      formData.append('file', file)
      return api('/api/upload', { method: 'POST', body: formData, headers: getAuthHeaders() })
    },

    // 认证
    async getMe() {
      return api('/api/auth/me', { headers: getAuthHeaders() })
    },

    getLoginUrl() {
      return `${baseURL}/api/auth/github`
    },
  }
}
```

---

### Task 11: 后台布局 + AdminSidebar 组件

**Files:**
- Create: `d:\project\personal blob\frontend\app\layouts\admin.vue`
- Create: `d:\project\personal blob\frontend\app\components\AdminSidebar.vue`

- [ ] **Step 1: 创建后台布局 admin.vue**

```vue
<script setup lang="ts">
useHead({ titleTemplate: (title) => title ? `${title} — Admin` : 'Admin — Personal Blob' })
</script>

<template>
  <div class="admin-shell">
    <AdminSidebar />
    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>

<style>
@import url('~/assets/css/tokens.css');
@import url('~/assets/css/reset.css');
@import url('~/assets/css/typography.css');

.admin-shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.admin-main {
  flex: 1;
  margin-left: 240px;
  padding: var(--space-xl);
  max-width: calc(100vw - 240px);
}
</style>
```

- [ ] **Step 2: 创建 AdminSidebar.vue**

```vue
<script setup lang="ts">
const token = ref('')
const user = ref<any>(null)
const { getLoginUrl, getMe } = useApi()

onMounted(async () => {
  // 从 URL 参数获取 token（OAuth 回调后）
  const route = useRoute()
  if (route.query.token) {
    localStorage.setItem('admin_token', route.query.token as string)
    await navigateTo('/admin')
  }

  token.value = localStorage.getItem('admin_token') || ''
  if (token.value) {
    try {
      const res = await getMe()
      user.value = res.data
    } catch {
      localStorage.removeItem('admin_token')
    }
  }
})

function logout() {
  localStorage.removeItem('admin_token')
  user.value = null
  navigateTo('/admin/login')
}

const nav = [
  { label: '仪表盘', icon: '⊞', to: '/admin' },
  { label: '文章', icon: '✎', to: '/admin/articles' },
  { label: '项目', icon: '◧', to: '/admin/projects' },
]
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <NuxtLink to="/admin" class="sidebar-logo label">Personal Blob</NuxtLink>
      <span class="sidebar-badge label">Admin</span>
    </div>

    <nav class="sidebar-nav">
      <NuxtLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="sidebar-link label"
        :class="{ 'sidebar-link--active': $route.path === item.to || $route.path.startsWith(item.to + '/') }"
      >
        <span class="sidebar-icon">{{ item.icon }}</span>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="sidebar-footer">
      <div v-if="user" class="sidebar-user">
        <img :src="user.avatar_url" class="sidebar-avatar" />
        <span class="sidebar-username caption">{{ user.github_login }}</span>
      </div>
      <button v-if="user" @click="logout" class="sidebar-logout label">退出</button>
      <a v-else :href="getLoginUrl()" class="sidebar-login label">Login</a>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;
  background: var(--color-bg-alt);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.sidebar-logo {
  font-weight: 600;
  letter-spacing: 0.05em;
}

.sidebar-badge {
  font-size: 0.6rem;
  padding: 0.25em 0.5em;
  background: var(--color-primary);
  color: var(--color-reversed);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: 4px;
  color: var(--color-text-secondary);
  transition: all var(--duration-fast) var(--ease-out-quart);
}

.sidebar-link:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.sidebar-link--active {
  background: var(--color-primary);
  color: var(--color-reversed);
}

.sidebar-icon {
  width: 20px;
  text-align: center;
  font-size: 1rem;
}

.sidebar-footer {
  padding: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.sidebar-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.sidebar-username {
  color: var(--color-text-secondary);
}

.sidebar-logout,
.sidebar-login {
  display: block;
  width: 100%;
  text-align: center;
  padding: var(--space-2xs);
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: none;
  transition: all var(--duration-fast) var(--ease-out-quart);
}

.sidebar-logout:hover,
.sidebar-login:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
```

---

### Task 12: 创建 MarkdownEditor 组件

**Files:**
- Create: `d:\project\personal blob\frontend\app\components\MarkdownEditor.vue`

- [ ] **Step 1: 创建基于 CodeMirror 6 的 Markdown 编辑器组件

```vue
<script setup lang="ts">
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorEl = ref<HTMLElement | null>(null)
const previewEl = ref<HTMLElement | null>(null)
const showPreview = ref(false)
let view: EditorView | null = null

// 初始化 markdown-it 用于预览
let md: any = null
if (import.meta.client) {
  import('markdown-it').then(markdownIt => {
    md = markdownIt.default({ html: true, linkify: true, typographer: true })
  })
}

onMounted(() => {
  if (!editorEl.value) return

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      emit('update:modelValue', update.state.doc.toString())
    }
  })

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      markdown({ base: markdownLanguage }),
      oneDark,
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      updateListener,
      EditorView.theme({
        '&': { height: '100%', fontSize: '14px' },
        '.cm-scroller': { fontFamily: "'JetBrains Mono', monospace", lineHeight: '1.7' },
      }),
    ],
  })

  view = new EditorView({ state, parent: editorEl.value })
})

onBeforeUnmount(() => {
  view?.destroy()
})

// 监听外部 v-model 变化
watch(() => props.modelValue, (newVal) => {
  if (view && newVal !== view.state.doc.toString()) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newVal },
    })
  }
})

function insertImage(url: string) {
  if (!view) return
  const pos = view.state.selection.main.head
  view.dispatch({
    changes: { from: pos, insert: `![图片](${url})\n` },
  })
}

function getPreviewHtml() {
  if (!md) return ''
  return md.render(props.modelValue || '')
}

defineExpose({ insertImage })
</script>

<template>
  <div class="markdown-editor">
    <div class="editor-toolbar">
      <label class="toolbar-label">正文 (Markdown)</label>
      <button class="toolbar-btn label" @click="showPreview = !showPreview">
        {{ showPreview ? '编辑' : '预览' }}
      </button>
    </div>
    <div class="editor-body">
      <div ref="editorEl" class="editor-cm" :class="{ 'editor-cm--hidden': showPreview }"></div>
      <div
        v-if="showPreview"
        ref="previewEl"
        class="editor-preview prose"
        v-html="getPreviewHtml()"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-bg-alt);
  border-bottom: 1px solid var(--color-border);
}

.toolbar-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.toolbar-btn {
  font-size: 0.7rem;
  padding: 0.25em 0.75em;
  background: none;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out-quart);
}

.toolbar-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.editor-body {
  min-height: 400px;
}

.editor-cm {
  height: 500px;
}

.editor-cm--hidden {
  display: none;
}

.editor-preview {
  height: 500px;
  overflow-y: auto;
  padding: var(--space-md);
}
</style>
```

---

### Task 13: 后台登录页面

**Files:**
- Create: `d:\project\personal blob\frontend\app\pages\admin\login.vue`

- [ ] **Step 1: 创建登录页**

```vue
<script setup lang="ts">
definePageMeta({ layout: false })

const { getLoginUrl } = useApi()
const route = useRoute()
const error = computed(() => {
  const e = route.query.error
  if (e === 'not_authorized') return '此 GitHub 账号未在管理员白名单中'
  if (e === 'token_failed') return 'GitHub 认证失败，请重试'
  if (e === 'server_error') return '服务器错误，请稍后重试'
  return ''
})
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-block"></div>
      <h1 class="display login-title">Admin</h1>
      <p class="login-desc">使用 GitHub 账号登录管理后台</p>

      <p v-if="error" class="login-error">{{ error }}</p>

      <a :href="getLoginUrl()" class="login-btn label">
        Login with GitHub
      </a>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-2xl);
  border: 1px solid var(--color-border);
  max-width: 380px;
  width: 100%;
}

.login-block {
  width: 60px;
  height: 60px;
  background: var(--color-primary);
}

.login-title {
  font-size: 2.5rem;
  letter-spacing: -0.03em;
}

.login-desc {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.login-error {
  color: oklch(55% 0.2 30);
  font-size: 0.85rem;
  text-align: center;
  padding: var(--space-xs) var(--space-sm);
  background: oklch(90% 0.1 30 / 0.2);
  width: 100%;
}

.login-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-text);
  color: var(--color-bg);
  transition: background var(--duration-fast) var(--ease-out-quart);
  width: 100%;
  justify-content: center;
}

.login-btn:hover {
  background: var(--color-primary);
}
</style>
```

---

### Task 14: 后台仪表盘页面

**Files:**
- Create: `d:\project\personal blob\frontend\app\pages\admin\index.vue`

- [ ] **Step 1: 创建仪表盘页**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()

const { data: articlesData } = await useAsyncData('admin-articles', () => api.getArticles())
const { data: projectsData } = await useAsyncData('admin-projects', () => api.getProjects())
const { data: userData } = await useAsyncData('admin-me', () => api.getMe())

const articles = computed(() => articlesData.value?.data || [])
const projects = computed(() => projectsData.value?.data || [])
const user = computed(() => userData.value?.data || null)

const publishedArticles = computed(() => articles.value.filter((a: any) => a.published).length)
const publishedProjects = computed(() => projects.value.filter((p: any) => p.published).length)
</script>

<template>
  <div class="dashboard">
    <div class="dash-header">
      <div>
        <h1 class="title">仪表盘</h1>
        <p v-if="user" class="dash-welcome caption">
          欢迎回来，{{ user.github_login }}
          <img :src="user.avatar_url" class="dash-avatar" />
        </p>
      </div>
    </div>

    <div class="dash-cards">
      <div class="dash-card">
        <span class="dash-card-icon">✎</span>
        <span class="dash-card-num">{{ articles.length }}</span>
        <span class="dash-card-label label">文章 ({{ publishedArticles }} 已发布)</span>
        <NuxtLink to="/admin/articles/new" class="dash-card-action label">写新文章 →</NuxtLink>
      </div>
      <div class="dash-card">
        <span class="dash-card-icon">◧</span>
        <span class="dash-card-num">{{ projects.length }}</span>
        <span class="dash-card-label label">项目 ({{ publishedProjects }} 已发布)</span>
        <NuxtLink to="/admin/projects/new" class="dash-card-action label">添加项目 →</NuxtLink>
      </div>
    </div>

    <div class="dash-section">
      <h2 class="title">最近文章</h2>
      <div v-if="articles.length" class="dash-list">
        <div v-for="a in articles.slice(0, 5)" :key="a.id" class="dash-list-item">
          <span :class="['dash-status', a.published ? 'dash-status--live' : '']">
            {{ a.published ? '已发布' : '草稿' }}
          </span>
          <NuxtLink :to="`/admin/articles/${a.id}`" class="dash-list-title">{{ a.title }}</NuxtLink>
          <span class="caption dash-list-date">{{ new Date(a.created_at).toLocaleDateString('zh-CN') }}</span>
        </div>
      </div>
      <p v-else class="caption dash-empty">暂无文章</p>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 900px;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-xl);
}

.dash-welcome {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-2xs);
  color: var(--color-text-secondary);
}

.dash-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.dash-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
}

.dash-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  transition: border-color var(--duration-fast) var(--ease-out-quart);
}

.dash-card:hover {
  border-color: var(--color-primary);
}

.dash-card-icon {
  font-size: 1.5rem;
}

.dash-card-num {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}

.dash-card-label {
  color: var(--color-text-secondary);
}

.dash-card-action {
  margin-top: var(--space-xs);
  color: var(--color-primary);
  font-size: 0.75rem;
}

.dash-section {
  margin-bottom: var(--space-xl);
}

.dash-section h2 {
  margin-bottom: var(--space-md);
}

.dash-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
}

.dash-list-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.dash-list-item:last-child {
  border-bottom: none;
}

.dash-status {
  font-size: 0.65rem;
  padding: 0.2em 0.5em;
  background: var(--color-bg-alt);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  white-space: nowrap;
}

.dash-status--live {
  background: oklch(90% 0.1 150 / 0.3);
  border-color: oklch(60% 0.15 150);
  color: oklch(40% 0.15 150);
}

.dash-list-title {
  flex: 1;
  color: var(--color-text);
  transition: color var(--duration-fast);
}

.dash-list-title:hover {
  color: var(--color-primary);
}

.dash-list-date {
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.dash-empty {
  color: var(--color-text-secondary);
  padding: var(--space-md);
  border: 1px dashed var(--color-border);
}
</style>
```

---

### Task 15: 管理后台路由中间件

**Files:**
- Create: `d:\project\personal blob\frontend\app\middleware\admin.ts`

- [ ] **Step 1: 创建后台鉴权中间件

```ts
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.client) {
    const token = localStorage.getItem('admin_token')
    if (!token && to.path !== '/admin/login') {
      return navigateTo('/admin/login')
    }
  }
})
```

---

### Task 16: 文章管理页面

**Files:**
- Create: `d:\project\personal blob\frontend\app\pages\admin\articles.vue`
- Create: `d:\project\personal blob\frontend\app\pages\admin\articles\new.vue`
- Create: `d:\project\personal blob\frontend\app\pages\admin\articles\[id].vue`

- [ ] **Step 1: 创建文章列表页 articles.vue**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const { data, refresh } = await useAsyncData('admin-articles-list', () => api.getArticles())
const articles = computed(() => data.value?.data || [])

async function togglePublish(article: any) {
  await api.updateArticle(article.id, { published: !article.published })
  refresh()
}

async function removeArticle(id: number) {
  if (!confirm('确定删除此文章？')) return
  await api.deleteArticle(id)
  refresh()
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="title">文章管理</h1>
        <p class="caption page-desc">共 {{ articles.length }} 篇文章</p>
      </div>
      <NuxtLink to="/admin/articles/new" class="page-btn label">写新文章</NuxtLink>
    </div>

    <div class="data-table">
      <div class="table-header">
        <span class="table-cell table-cell--wide">标题</span>
        <span class="table-cell">状态</span>
        <span class="table-cell">日期</span>
        <span class="table-cell">操作</span>
      </div>
      <div v-for="a in articles" :key="a.id" class="table-row">
        <span class="table-cell table-cell--wide">
          <NuxtLink :to="`/admin/articles/${a.id}`" class="table-title">{{ a.title }}</NuxtLink>
        </span>
        <span class="table-cell">
          <span :class="['badge', a.published ? 'badge--live' : 'badge--draft']">
            {{ a.published ? '已发布' : '草稿' }}
          </span>
        </span>
        <span class="table-cell caption">{{ new Date(a.created_at).toLocaleDateString('zh-CN') }}</span>
        <span class="table-cell table-actions">
          <NuxtLink :to="`/admin/articles/${a.id}`" class="action-link">编辑</NuxtLink>
          <button @click="togglePublish(a)" class="action-link">
            {{ a.published ? '下架' : '发布' }}
          </button>
          <button @click="removeArticle(a.id)" class="action-link action-link--danger">删除</button>
        </span>
      </div>
      <div v-if="!articles.length" class="table-empty caption">暂无文章</div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-xl);
}

.page-desc {
  margin-top: var(--space-2xs);
  color: var(--color-text-secondary);
}

.page-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xs) var(--space-md);
  background: var(--color-text);
  color: var(--color-bg);
  transition: background var(--duration-fast);
}

.page-btn:hover {
  background: var(--color-primary);
}

.data-table {
  border: 1px solid var(--color-border);
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 80px 100px 160px;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-alt);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 80px 100px 160px;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--color-border);
  align-items: center;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell--wide {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-title {
  color: var(--color-text);
  transition: color var(--duration-fast);
}

.table-title:hover {
  color: var(--color-primary);
}

.badge {
  font-size: 0.65rem;
  padding: 0.2em 0.5em;
  white-space: nowrap;
}

.badge--live {
  background: oklch(90% 0.1 150 / 0.3);
  color: oklch(40% 0.15 150);
}

.badge--draft {
  background: var(--color-bg-alt);
  color: var(--color-text-secondary);
}

.table-actions {
  display: flex;
  gap: var(--space-sm);
}

.action-link {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color var(--duration-fast);
}

.action-link:hover {
  color: var(--color-primary);
}

.action-link--danger:hover {
  color: oklch(55% 0.2 30);
}

.table-empty {
  padding: var(--space-xl);
  text-align: center;
  color: var(--color-text-secondary);
}
</style>
```

- [ ] **Step 2: 创建文章编辑器 new.vue**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const router = useRouter()

const form = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  tags: '',
  cover_image: '',
  published: false,
})

const saving = ref(false)
const error = ref('')
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null)

function autoSlug() {
  if (!form.slug && form.title) {
    form.slug = form.title.toLowerCase().replace(/[^\w一-龥]+/g, '-').replace(/^-+|-+$/g, '')
  }
}

async function save(publish: boolean) {
  saving.value = true
  error.value = ''
  try {
    const tags = form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    await api.createArticle({
      title: form.title,
      slug: form.slug || undefined,
      excerpt: form.excerpt,
      content: form.content,
      tags,
      cover_image: form.cover_image || null,
      published: publish,
    })
    router.push('/admin/articles')
  } catch (e: any) {
    error.value = e?.data?.error?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const res = await api.uploadImage(file)
    const url = res.data.url
    if (editorRef.value) {
      editorRef.value.insertImage(url)
    }
  } catch {
    error.value = '上传失败'
  }
}
</script>

<template>
  <div class="editor-page">
    <div class="page-header">
      <h1 class="title">写文章</h1>
      <div class="header-actions">
        <button :disabled="saving" class="page-btn label" @click="save(false)">保存草稿</button>
        <button :disabled="saving" class="page-btn page-btn--primary label" @click="save(true)">发布</button>
      </div>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="editor-form">
      <div class="form-group">
        <label class="form-label label">标题 *</label>
        <input v-model="form.title" class="form-input form-input--title" placeholder="文章标题" @input="autoSlug" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label label">Slug</label>
          <input v-model="form.slug" class="form-input" placeholder="article-slug" />
        </div>
        <div class="form-group">
          <label class="form-label label">标签</label>
          <input v-model="form.tags" class="form-input" placeholder="标签1, 标签2" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label label">摘要</label>
        <textarea v-model="form.excerpt" class="form-input form-textarea" placeholder="文章摘要" rows="2"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label label">封面图 URL</label>
        <div class="form-upload-row">
          <input v-model="form.cover_image" class="form-input" placeholder="https://..." />
          <label class="upload-btn label">
            上传
            <input type="file" accept="image/*" hidden @change="handleImageUpload" />
          </label>
        </div>
      </div>

      <div class="form-group">
        <MarkdownEditor ref="editorRef" v-model="form.content" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-page {
  max-width: 900px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.header-actions {
  display: flex;
  gap: var(--space-sm);
}

.page-btn {
  padding: var(--space-xs) var(--space-md);
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.page-btn:hover {
  border-color: var(--color-primary);
}

.page-btn--primary {
  background: var(--color-text);
  color: var(--color-bg);
  border-color: var(--color-text);
}

.page-btn--primary:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-error {
  padding: var(--space-xs) var(--space-sm);
  margin-bottom: var(--space-md);
  background: oklch(90% 0.1 30 / 0.2);
  color: oklch(55% 0.2 30);
  font-size: 0.85rem;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.form-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.form-input {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  font-family: var(--font-body);
  font-size: 0.9rem;
  transition: border-color var(--duration-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-input--title {
  font-size: 1.25rem;
  font-weight: 600;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.form-upload-row {
  display: flex;
  gap: var(--space-xs);
}

.form-upload-row .form-input {
  flex: 1;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xs) var(--space-md);
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all var(--duration-fast);
  white-space: nowrap;
}

.upload-btn:hover {
  border-color: var(--color-primary);
}
</style>
```

- [ ] **Step 3: 创建文章编辑页 [id].vue**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const router = useRouter()
const route = useRoute()

const { data } = await useAsyncData(`admin-article-${route.params.id}`, () =>
  api.getArticle(route.params.id as string)
)

const article = computed(() => data.value?.data)

const form = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  tags: '',
  cover_image: '',
  published: false,
})

const saving = ref(false)
const error = ref('')
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null)

watch(article, (a) => {
  if (a) {
    form.title = a.title || ''
    form.slug = a.slug || ''
    form.excerpt = a.excerpt || ''
    form.content = a.content || ''
    form.tags = (a.tags || []).join(', ')
    form.cover_image = a.cover_image || ''
    form.published = !!a.published
  }
}, { immediate: true })

async function save(publish: boolean) {
  saving.value = true
  error.value = ''
  try {
    const tags = form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    await api.updateArticle(Number(route.params.id), {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      tags,
      cover_image: form.cover_image || null,
      published: publish,
    })
    router.push('/admin/articles')
  } catch (e: any) {
    error.value = e?.data?.error?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const res = await api.uploadImage(file)
    if (editorRef.value) editorRef.value.insertImage(res.data.url)
  } catch {
    error.value = '上传失败'
  }
}
</script>

<template>
  <div class="editor-page" v-if="article">
    <div class="page-header">
      <h1 class="title">编辑文章</h1>
      <div class="header-actions">
        <button :disabled="saving" class="page-btn label" @click="save(false)">保存草稿</button>
        <button :disabled="saving" class="page-btn page-btn--primary label" @click="save(true)">发布</button>
      </div>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="editor-form">
      <div class="form-group">
        <label class="form-label label">标题 *</label>
        <input v-model="form.title" class="form-input form-input--title" placeholder="文章标题" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label label">Slug</label>
          <input v-model="form.slug" class="form-input" placeholder="article-slug" />
        </div>
        <div class="form-group">
          <label class="form-label label">标签</label>
          <input v-model="form.tags" class="form-input" placeholder="标签1, 标签2" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label label">摘要</label>
        <textarea v-model="form.excerpt" class="form-input form-textarea" rows="2"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label label">封面图</label>
        <div class="form-upload-row">
          <input v-model="form.cover_image" class="form-input" placeholder="https://..." />
          <label class="upload-btn label">
            上传
            <input type="file" accept="image/*" hidden @change="handleImageUpload" />
          </label>
        </div>
      </div>

      <div class="form-group">
        <MarkdownEditor ref="editorRef" v-model="form.content" />
      </div>
    </div>
  </div>
  <div v-else class="loading caption">加载中...</div>
</template>

<style scoped>
/* Same styles as new.vue */
.editor-page { max-width: 900px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.header-actions { display: flex; gap: var(--space-sm); }
.page-btn { padding: var(--space-xs) var(--space-md); background: var(--color-bg-alt); border: 1px solid var(--color-border); cursor: pointer; transition: all var(--duration-fast); }
.page-btn:hover { border-color: var(--color-primary); }
.page-btn--primary { background: var(--color-text); color: var(--color-bg); border-color: var(--color-text); }
.page-btn--primary:hover { background: var(--color-primary); border-color: var(--color-primary); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.form-error { padding: var(--space-xs) var(--space-sm); margin-bottom: var(--space-md); background: oklch(90% 0.1 30 / 0.2); color: oklch(55% 0.2 30); font-size: 0.85rem; }
.editor-form { display: flex; flex-direction: column; gap: var(--space-md); }
.form-group { display: flex; flex-direction: column; gap: var(--space-2xs); }
.form-label { font-size: 0.75rem; color: var(--color-text-secondary); }
.form-input { padding: var(--space-xs) var(--space-sm); border: 1px solid var(--color-border); background: var(--color-bg); font-family: var(--font-body); font-size: 0.9rem; transition: border-color var(--duration-fast); }
.form-input:focus { outline: none; border-color: var(--color-primary); }
.form-input--title { font-size: 1.25rem; font-weight: 600; }
.form-textarea { resize: vertical; min-height: 60px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.form-upload-row { display: flex; gap: var(--space-xs); }
.form-upload-row .form-input { flex: 1; }
.upload-btn { display: inline-flex; align-items: center; padding: var(--space-xs) var(--space-md); background: var(--color-bg-alt); border: 1px solid var(--color-border); cursor: pointer; font-size: 0.75rem; transition: all var(--duration-fast); white-space: nowrap; }
.upload-btn:hover { border-color: var(--color-primary); }
.loading { padding: var(--space-xl); text-align: center; color: var(--color-text-secondary); }
</style>
```

---

### Task 17: 项目管理页面

**Files:**
- Create: `d:\project\personal blob\frontend\app\pages\admin\projects.vue`
- Create: `d:\project\personal blob\frontend\app\pages\admin\projects\new.vue`
- Create: `d:\project\personal blob\frontend\app\pages\admin\projects\[id].vue`

- [ ] **Step 1: 创建项目列表页 projects.vue**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const { data, refresh } = await useAsyncData('admin-projects-list', () => api.getProjects())
const projects = computed(() => data.value?.data || [])

async function togglePublish(project: any) {
  await api.updateProject(project.id, { published: !project.published })
  refresh()
}

async function removeProject(id: number) {
  if (!confirm('确定删除此项目？')) return
  await api.deleteProject(id)
  refresh()
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="title">项目管理</h1>
        <p class="caption page-desc">共 {{ projects.length }} 个项目</p>
      </div>
      <NuxtLink to="/admin/projects/new" class="page-btn label">添加项目</NuxtLink>
    </div>

    <div class="data-table">
      <div class="table-header">
        <span class="table-cell table-cell--wide">标题</span>
        <span class="table-cell">状态</span>
        <span class="table-cell">日期</span>
        <span class="table-cell">操作</span>
      </div>
      <div v-for="p in projects" :key="p.id" class="table-row">
        <span class="table-cell table-cell--wide">
          <NuxtLink :to="`/admin/projects/${p.id}`" class="table-title">{{ p.title }}</NuxtLink>
        </span>
        <span class="table-cell">
          <span :class="['badge', p.published ? 'badge--live' : 'badge--draft']">
            {{ p.published ? '已发布' : '草稿' }}
          </span>
        </span>
        <span class="table-cell caption">{{ new Date(p.created_at).toLocaleDateString('zh-CN') }}</span>
        <span class="table-cell table-actions">
          <NuxtLink :to="`/admin/projects/${p.id}`" class="action-link">编辑</NuxtLink>
          <button @click="togglePublish(p)" class="action-link">{{ p.published ? '下架' : '发布' }}</button>
          <button @click="removeProject(p.id)" class="action-link action-link--danger">删除</button>
        </span>
      </div>
      <div v-if="!projects.length" class="table-empty caption">暂无项目</div>
    </div>
  </div>
</template>

<style scoped>
/* Same styles as articles list */
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-xl); }
.page-desc { margin-top: var(--space-2xs); color: var(--color-text-secondary); }
.page-btn { display: inline-flex; align-items: center; padding: var(--space-xs) var(--space-md); background: var(--color-text); color: var(--color-bg); transition: background var(--duration-fast); }
.page-btn:hover { background: var(--color-primary); }
.data-table { border: 1px solid var(--color-border); }
.table-header { display: grid; grid-template-columns: 1fr 80px 100px 160px; gap: var(--space-sm); padding: var(--space-sm) var(--space-md); background: var(--color-bg-alt); border-bottom: 1px solid var(--color-border); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; color: var(--color-text-secondary); }
.table-row { display: grid; grid-template-columns: 1fr 80px 100px 160px; gap: var(--space-sm); padding: var(--space-sm) var(--space-md); border-bottom: 1px solid var(--color-border); align-items: center; }
.table-row:last-child { border-bottom: none; }
.table-cell--wide { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.table-title { color: var(--color-text); transition: color var(--duration-fast); }
.table-title:hover { color: var(--color-primary); }
.badge { font-size: 0.65rem; padding: 0.2em 0.5em; white-space: nowrap; }
.badge--live { background: oklch(90% 0.1 150 / 0.3); color: oklch(40% 0.15 150); }
.badge--draft { background: var(--color-bg-alt); color: var(--color-text-secondary); }
.table-actions { display: flex; gap: var(--space-sm); }
.action-link { font-size: 0.8rem; color: var(--color-text-secondary); background: none; border: none; cursor: pointer; padding: 0; transition: color var(--duration-fast); }
.action-link:hover { color: var(--color-primary); }
.action-link--danger:hover { color: oklch(55% 0.2 30); }
.table-empty { padding: var(--space-xl); text-align: center; color: var(--color-text-secondary); }
</style>
```

- [ ] **Step 2: 创建新建项目页 new.vue**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const router = useRouter()

const form = reactive({
  title: '',
  excerpt: '',
  content: '',
  tags: '',
  cover_image: '',
  url: '',
  published: false,
})

const saving = ref(false)
const error = ref('')
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null)

async function save(publish: boolean) {
  saving.value = true
  error.value = ''
  try {
    const tags = form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    await api.createProject({
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      tags,
      cover_image: form.cover_image || null,
      url: form.url || null,
      published: publish,
    })
    router.push('/admin/projects')
  } catch (e: any) {
    error.value = e?.data?.error?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const res = await api.uploadImage(file)
    if (editorRef.value) editorRef.value.insertImage(res.data.url)
  } catch {
    error.value = '上传失败'
  }
}
</script>

<template>
  <div class="editor-page">
    <div class="page-header">
      <h1 class="title">添加项目</h1>
      <div class="header-actions">
        <button :disabled="saving" class="page-btn label" @click="save(false)">保存草稿</button>
        <button :disabled="saving" class="page-btn page-btn--primary label" @click="save(true)">发布</button>
      </div>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="editor-form">
      <div class="form-group">
        <label class="form-label label">标题 *</label>
        <input v-model="form.title" class="form-input form-input--title" placeholder="项目名称" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label label">标签</label>
          <input v-model="form.tags" class="form-input" placeholder="标签1, 标签2" />
        </div>
        <div class="form-group">
          <label class="form-label label">外部链接</label>
          <input v-model="form.url" class="form-input" placeholder="https://..." />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label label">摘要</label>
        <textarea v-model="form.excerpt" class="form-input form-textarea" rows="2" placeholder="项目简介"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label label">封面图</label>
        <div class="form-upload-row">
          <input v-model="form.cover_image" class="form-input" placeholder="https://..." />
          <label class="upload-btn label">
            上传
            <input type="file" accept="image/*" hidden @change="handleImageUpload" />
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label label">正文 (可选)</label>
        <MarkdownEditor ref="editorRef" v-model="form.content" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-page { max-width: 900px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.header-actions { display: flex; gap: var(--space-sm); }
.page-btn { padding: var(--space-xs) var(--space-md); background: var(--color-bg-alt); border: 1px solid var(--color-border); cursor: pointer; transition: all var(--duration-fast); }
.page-btn:hover { border-color: var(--color-primary); }
.page-btn--primary { background: var(--color-text); color: var(--color-bg); border-color: var(--color-text); }
.page-btn--primary:hover { background: var(--color-primary); border-color: var(--color-primary); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.form-error { padding: var(--space-xs) var(--space-sm); margin-bottom: var(--space-md); background: oklch(90% 0.1 30 / 0.2); color: oklch(55% 0.2 30); font-size: 0.85rem; }
.editor-form { display: flex; flex-direction: column; gap: var(--space-md); }
.form-group { display: flex; flex-direction: column; gap: var(--space-2xs); }
.form-label { font-size: 0.75rem; color: var(--color-text-secondary); }
.form-input { padding: var(--space-xs) var(--space-sm); border: 1px solid var(--color-border); background: var(--color-bg); font-family: var(--font-body); font-size: 0.9rem; transition: border-color var(--duration-fast); }
.form-input:focus { outline: none; border-color: var(--color-primary); }
.form-input--title { font-size: 1.25rem; font-weight: 600; }
.form-textarea { resize: vertical; min-height: 60px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.form-upload-row { display: flex; gap: var(--space-xs); }
.form-upload-row .form-input { flex: 1; }
.upload-btn { display: inline-flex; align-items: center; padding: var(--space-xs) var(--space-md); background: var(--color-bg-alt); border: 1px solid var(--color-border); cursor: pointer; font-size: 0.75rem; transition: all var(--duration-fast); white-space: nowrap; }
.upload-btn:hover { border-color: var(--color-primary); }
</style>
```

- [ ] **Step 3: 创建项目编辑页 [id].vue**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const router = useRouter()
const route = useRoute()

const { data } = await useAsyncData(`admin-project-${route.params.id}`, () =>
  api.getProject(route.params.id as string)
)

const project = computed(() => data.value?.data)

const form = reactive({
  title: '',
  excerpt: '',
  content: '',
  tags: '',
  cover_image: '',
  url: '',
  published: false,
})

const saving = ref(false)
const error = ref('')
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null)

watch(project, (p) => {
  if (p) {
    form.title = p.title || ''
    form.excerpt = p.excerpt || ''
    form.content = p.content || ''
    form.tags = (p.tags || []).join(', ')
    form.cover_image = p.cover_image || ''
    form.url = p.url || ''
    form.published = !!p.published
  }
}, { immediate: true })

async function save(publish: boolean) {
  saving.value = true
  error.value = ''
  try {
    const tags = form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    await api.updateProject(Number(route.params.id), {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      tags,
      cover_image: form.cover_image || null,
      url: form.url || null,
      published: publish,
    })
    router.push('/admin/projects')
  } catch (e: any) {
    error.value = e?.data?.error?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const res = await api.uploadImage(file)
    if (editorRef.value) editorRef.value.insertImage(res.data.url)
  } catch {
    error.value = '上传失败'
  }
}
</script>

<template>
  <div class="editor-page" v-if="project">
    <div class="page-header">
      <h1 class="title">编辑项目</h1>
      <div class="header-actions">
        <button :disabled="saving" class="page-btn label" @click="save(false)">保存草稿</button>
        <button :disabled="saving" class="page-btn page-btn--primary label" @click="save(true)">发布</button>
      </div>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="editor-form">
      <div class="form-group">
        <label class="form-label label">标题 *</label>
        <input v-model="form.title" class="form-input form-input--title" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label label">标签</label>
          <input v-model="form.tags" class="form-input" placeholder="标签1, 标签2" />
        </div>
        <div class="form-group">
          <label class="form-label label">外部链接</label>
          <input v-model="form.url" class="form-input" placeholder="https://..." />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label label">摘要</label>
        <textarea v-model="form.excerpt" class="form-input form-textarea" rows="2"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label label">封面图</label>
        <div class="form-upload-row">
          <input v-model="form.cover_image" class="form-input" placeholder="https://..." />
          <label class="upload-btn label">
            上传
            <input type="file" accept="image/*" hidden @change="handleImageUpload" />
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label label">正文 (可选)</label>
        <MarkdownEditor ref="editorRef" v-model="form.content" />
      </div>
    </div>
  </div>
  <div v-else class="loading caption">加载中...</div>
</template>

<style scoped>
/* Same styles as new project page */
.editor-page { max-width: 900px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.header-actions { display: flex; gap: var(--space-sm); }
.page-btn { padding: var(--space-xs) var(--space-md); background: var(--color-bg-alt); border: 1px solid var(--color-border); cursor: pointer; transition: all var(--duration-fast); }
.page-btn:hover { border-color: var(--color-primary); }
.page-btn--primary { background: var(--color-text); color: var(--color-bg); border-color: var(--color-text); }
.page-btn--primary:hover { background: var(--color-primary); border-color: var(--color-primary); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.form-error { padding: var(--space-xs) var(--space-sm); margin-bottom: var(--space-md); background: oklch(90% 0.1 30 / 0.2); color: oklch(55% 0.2 30); font-size: 0.85rem; }
.editor-form { display: flex; flex-direction: column; gap: var(--space-md); }
.form-group { display: flex; flex-direction: column; gap: var(--space-2xs); }
.form-label { font-size: 0.75rem; color: var(--color-text-secondary); }
.form-input { padding: var(--space-xs) var(--space-sm); border: 1px solid var(--color-border); background: var(--color-bg); font-family: var(--font-body); font-size: 0.9rem; transition: border-color var(--duration-fast); }
.form-input:focus { outline: none; border-color: var(--color-primary); }
.form-input--title { font-size: 1.25rem; font-weight: 600; }
.form-textarea { resize: vertical; min-height: 60px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.form-upload-row { display: flex; gap: var(--space-xs); }
.form-upload-row .form-input { flex: 1; }
.upload-btn { display: inline-flex; align-items: center; padding: var(--space-xs) var(--space-md); background: var(--color-bg-alt); border: 1px solid var(--color-border); cursor: pointer; font-size: 0.75rem; transition: all var(--duration-fast); white-space: nowrap; }
.upload-btn:hover { border-color: var(--color-primary); }
.loading { padding: var(--space-xl); text-align: center; color: var(--color-text-secondary); }
</style>
```

---

### Task 18: 公开页面迁移 — 首页

**Files:**
- Modify: `d:\project\personal blob\frontend\app\pages\index.vue`

- [ ] **Step 1: 替换 queryCollection 为 API 调用**

关键变化：
- 移除 `queryCollection('articles')`，改为 `useApi().getArticles()`
- 属性映射：`article.id` → `article.slug`（用于路由），`article.date` → `article.created_at`
- 过滤已发布的文章（`published = 1`）

```vue
<script setup lang="ts">
const api = useApi()

const { data: articlesData } = await useAsyncData('home-articles', () =>
  api.getArticles({ published: 1 })
)
const { data: projectsData } = await useAsyncData('home-projects', () =>
  api.getProjects({ published: 1 })
)

const articles = computed(() => (articlesData.value?.data || []).slice(0, 2))
const projects = computed(() => (projectsData.value?.data || []).slice(0, 2))
</script>
```

> 模板部分无需修改，因为数据结构兼容：`article.title`、`article.excerpt`、`article.tags`、`article.date`（API 返回中已添加 `date` 别名）。

---

### Task 19: 公开页面迁移 — 文章列表

**Files:**
- Modify: `d:\project\personal blob\frontend\app\pages\articles\index.vue`

- [ ] **Step 1: 替换 queryCollection 为 API 调用**

```vue
<script setup lang="ts">
useHead({ title: 'Writing' })

const api = useApi()
const { data } = await useAsyncData('articles', () =>
  api.getArticles({ published: 1 })
)
const articles = computed(() => data.value?.data || [])
</script>
```

> 模板无需修改，数据字段兼容。

---

### Task 20: 公开页面迁移 — 文章详情

**Files:**
- Modify: `d:\project\personal blob\frontend\app\pages\articles\[slug].vue`

- [ ] **Step 1: 替换 queryCollection + ContentRenderer**

关键变化：
- `queryCollection('articles').where('path', ...)` → `api.getArticle(slug)`
- `<ContentRenderer :value="article" />` → 使用 markdown-it 渲染

```vue
<script setup lang="ts">
import { markdownit } from 'markdown-it'

const route = useRoute('articles-slug')
const api = useApi()

const { data } = await useAsyncData(`article-${route.params.slug}`, () =>
  api.getArticle(route.params.slug as string)
)

const article = computed(() => data.value?.data || null)

const md = markdownit({ html: true, linkify: true, typographer: true })
const renderedContent = computed(() => article.value ? md.render(article.value.content || '') : '')

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found' })
}

useHead({
  title: article.value.title,
  meta: [{ name: 'description', content: article.value.excerpt }],
})
</script>

<template>
  <article v-if="article" class="article-spread">
    <header class="article-masthead">
      <div class="article-masthead-inner">
        <div class="article-meta-row">
          <time class="article-meta label" :datetime="article.created_at">
            {{ new Date(article.created_at).toLocaleDateString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric'
            }) }}
          </time>
          <div v-if="article.tags?.length" class="article-tags">
            <span v-for="tag in article.tags" :key="tag" class="article-tag label">{{ tag }}</span>
          </div>
        </div>
        <div class="article-title-block">
          <div class="article-title-accent"></div>
          <div class="article-title-text">
            <h1 class="display article-title">{{ article.title }}</h1>
            <p v-if="article.excerpt" class="article-deck">{{ article.excerpt }}</p>
          </div>
        </div>
      </div>
      <div class="article-header-bar"></div>
    </header>

    <div class="article-body prose mag-prose" v-html="renderedContent"></div>
  </article>
</template>
```

---

### Task 21: 公开页面迁移 — 项目列表 + 关于页面

**Files:**
- Modify: `d:\project\personal blob\frontend\app\pages\projects\index.vue`
- Modify: `d:\project\personal blob\frontend\app\pages\about.vue`

- [ ] **Step 1: 更新项目列表页**

```vue
<script setup lang="ts">
useHead({ title: 'Projects' })

const api = useApi()
const { data } = await useAsyncData('projects', () =>
  api.getProjects({ published: 1 })
)
const projects = computed(() => data.value?.data || [])
</script>
```

> 模板无需修改。

- [ ] **Step 2: 更新关于页面**

```vue
<script setup lang="ts">
useHead({ title: 'About' })

const api = useApi()
const { data: articlesData } = await useAsyncData('about-articles', () =>
  api.getArticles({ published: 1 })
)
const { data: projectsData } = await useAsyncData('about-projects', () =>
  api.getProjects({ published: 1 })
)

const articles = computed(() => articlesData.value?.data || [])
const projects = computed(() => projectsData.value?.data || [])
</script>
```

> 模板无需修改。

---

### Task 22: 根目录 dev 启动脚本

**Files:**
- Create: `d:\project\personal blob\package.json`（根目录启动脚本）
- Create: `d:\project\personal blob\dev.bat`（Windows 一键启动）

- [ ] **Step 1: 创建根目录 package.json**

```json
{
  "name": "personal-blob-workspace",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && node --watch src/index.js",
    "dev:frontend": "cd frontend && npx nuxt dev",
    "seed": "cd backend && node src/db/seed.js"
  },
  "devDependencies": {
    "concurrently": "^9.0.1"
  }
}
```

- [ ] **Step 2: 安装根目录依赖**

Run: `cd d:/project/personal\ blob && npm install`

- [ ] **Step 3: 验证端到端流程**

1. 启动后端：`cd backend && node src/index.js`
2. 启动前端：`cd frontend && npx nuxt dev`
3. 访问 `http://localhost:3000` — 首页正常显示
4. 访问 `http://localhost:3000/articles` — 文章列表正常
5. 访问 `http://localhost:3000/admin/login` — 登录页正常
6. 访问 `http://localhost:3001/api/health` — 返回 `{"status":"ok"}`
7. 访问 `http://localhost:3001/api/articles` — 返回种子数据
