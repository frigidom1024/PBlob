# Nuxt 3 → Vue 3 (Vite) 迁移设计

**日期：** 2026-06-13
**项目：** Personal Blob — 前端重构

---

## 1. 概述

将 Personal Blob 前端从 Nuxt 3 迁移到标准 Vue 3 + Vite 项目。保留所有现有组件、样式和业务逻辑，只替换 Nuxt 特有的框架 API。

### 迁移原则

1. **最小化改动** — 保留所有 `.vue` 文件的模板和样式，只改 script 部分
2. **按模块替换，一次一个** — 路由 → 数据获取 → 构建 → 部署
3. **不做功能增强** — 本次只迁移，不改功能

---

## 2. 目标目录结构

```
frontend/
├── src/
│   ├── assets/css/          ← 原 app/assets/css/，不变
│   ├── components/          ← 原 app/components/，不变
│   ├── composables/
│   │   └── useApi.ts        ← 重写，移除 Nuxt API 依赖
│   ├── layouts/
│   │   ├── DefaultLayout.vue ← 从 app/layouts/default.vue 迁移
│   │   └── AdminLayout.vue   ← 从 app/layouts/admin.vue 迁移
│   ├── router/
│   │   ├── index.ts          ← 新建，手动路由配置
│   │   └── authGuard.ts      ← 从 app/middleware/admin.ts 迁移
│   ├── pages/                ← 从 app/pages/ 迁移，路由参数语法调整
│   │   ├── index.vue
│   │   ├── about.vue
│   │   ├── articles/
│   │   │   ├── index.vue
│   │   │   ├── library.vue
│   │   │   └── Slug.vue      ← 原 [slug].vue
│   │   ├── projects/
│   │   │   └── index.vue
│   │   └── admin/
│   │       ├── index.vue
│   │       ├── login.vue
│   │       ├── workbench.vue
│   │       ├── articles/
│   │       │   ├── index.vue
│   │       │   ├── create.vue
│   │       │   └── Id.vue    ← 原 [id].vue
│   │       └── projects/
│   │           ├── index.vue
│   │           ├── create.vue
│   │           └── Id.vue    ← 原 [id].vue
│   ├── App.vue               ← 从 app/app.vue 迁移
│   └── main.ts               ← 新建
├── public/
│   └── favicon.ico           ← 不变
├── .env                      ← 原 .env，前缀改为 VITE_
├── .gitignore
├── index.html                ← 新建
├── vite.config.ts            ← 替代 nuxt.config.ts
├── package.json
├── tsconfig.json
├── env.d.ts                  ← 新建
├── Dockerfile                ← 重写
├── DESIGN.md                 ← 不变
├── PRODUCT.md                ← 不变
└── README.md                 ← 更新
```

### 删除

- `app/` → 迁移到 `src/`
- `content/` → 删除（未使用）
- `.nuxt/` → 删除（构建缓存）
- `.output/` → 删除（构建产物）
- `nuxt.config.ts` → 删除
- `docker-compose.prod.yml` → 更新（如果前端镜像改变）

---

## 3. 路由设计

### 3.1 路由表

```typescript
// src/router/index.ts
const routes = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      { path: '',           name: 'home',     component: () => import('@/pages/index.vue') },
      { path: 'about',      name: 'about',    component: () => import('@/pages/about.vue') },
      { path: 'articles',   name: 'articles', component: () => import('@/pages/articles/index.vue') },
      { path: 'articles/library', name: 'library', component: () => import('@/pages/articles/library.vue') },
      { path: 'articles/:slug',  name: 'article-detail', component: () => import('@/pages/articles/Slug.vue') },
      { path: 'projects',   name: 'projects', component: () => import('@/pages/projects/index.vue') },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    beforeEnter: authGuard,
    children: [
      { path: '',               name: 'admin-dashboard', component: () => import('@/pages/admin/index.vue') },
      { path: 'login',          name: 'admin-login',     component: () => import('@/pages/admin/login.vue') },
      { path: 'workbench',      name: 'admin-workbench', component: () => import('@/pages/admin/workbench.vue') },
      { path: 'articles',       name: 'admin-articles',  component: () => import('@/pages/admin/articles/index.vue') },
      { path: 'articles/create', name: 'admin-articles-create', component: () => import('@/pages/admin/articles/create.vue') },
      { path: 'articles/:id',   name: 'admin-articles-edit', component: () => import('@/pages/admin/articles/Id.vue') },
      { path: 'projects',       name: 'admin-projects',  component: () => import('@/pages/admin/projects/index.vue') },
      { path: 'projects/create', name: 'admin-projects-create', component: () => import('@/pages/admin/projects/create.vue') },
      { path: 'projects/:id',   name: 'admin-projects-edit', component: () => import('@/pages/admin/projects/Id.vue') },
    ],
  },
]
```

### 3.2 认证守卫

```typescript
// src/router/authGuard.ts
export function authGuard(to, from, next) {
  const isDev = import.meta.env.VITE_APP_ENV !== 'production'
  if (isDev) return next()
  const token = localStorage.getItem('admin_token')
  // 如果 URL 里有 token 参数，先保存再重定向
  if (to.query.token) {
    localStorage.setItem('admin_token', to.query.token as string)
    const { token: _, ...query } = to.query
    return next({ path: to.path, query })
  }
  if (!token && to.path !== '/admin/login') {
    return next('/admin/login')
  }
  next()
}
```

---

## 4. Nuxt API 替换

### 4.1 数据获取

`useAsyncData()` 替换为 `onMounted` + `ref`：

```typescript
// 之前 (Nuxt)
const { data } = await useAsyncData('articles', () => api.getArticles())
const articles = computed(() => data.value?.data || [])

// 之后 (Vue)
import { ref, computed, onMounted } from 'vue'
const articles = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.getArticles()
    articles.value = res.data || []
  } finally {
    loading.value = false
  }
})
```

### 4.2 Head 管理

安装 `@unhead/vue`，API 完全兼容：

```diff
- useHead({ title: 'Writing' })
+ import { useHead } from '@unhead/vue'
+ useHead({ title: 'Writing' })
```

不再需要 `useHead` 中的 `link` 数组（Google Fonts 引用移入 `index.html`）。

### 4.3 路由相关

| Nuxt API | Vue 替代 |
|----------|---------|
| `useRoute()` | `import { useRoute } from 'vue-router'` |
| `useRouter()` | `import { useRouter } from 'vue-router'` |
| `navigateTo(path)` | `router.push(path)` |
| `NuxtLink` | `RouterLink`（属性完全一致） |
| `useRoute('articles-slug')` | `useRoute().params.slug` |

### 4.4 运行时配置

```diff
- const config = useRuntimeConfig()
- const baseURL = config.public.apiBaseUrl
+ const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
+ const APP_ENV = import.meta.env.VITE_APP_ENV || 'development'
```

### 4.5 布局系统

- `definePageMeta({ layout: 'admin' })` → 通过路由嵌套实现
- `app.vue` 中的 `<NuxtLayout>` → `<router-view />`
- 布局中的 `<slot />` → `<router-view />`

### 4.6 自动导入

所有页面的 script 中需手动导入 Vue API：

```typescript
import { ref, computed, onMounted, reactive, watch, nextTick } from 'vue'
```

组件导入（原 Nuxt 自动注册）也要显式导入：

```typescript
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import ScrollReveal from '@/components/ScrollReveal.vue'
```

### 4.7 HTTP 客户端

`useApi.ts` 中的 `$fetch`（来自 `ofetch`）替换为原生 `fetch`，或保留 `ofetch` 包作为独立依赖。

### 4.8 错误处理

`createError()` 删除，改为页面内状态管理：

```typescript
const notFound = ref(false)
// 如果 API 返回空
if (!article.value) notFound.value = true
// 模板中处理
<div v-if="notFound">404 - 文章未找到</div>
```

---

## 5. 构建与部署

### 5.1 Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

### 5.2 依赖

```json
{
  "dependencies": {
    "vue": "^3.5.35",
    "vue-router": "^5.1.0",
    "@unhead/vue": "^2.0.0",
    "codemirror": "^6.0.2",
    "@codemirror/commands": "^6.10.3",
    "@codemirror/lang-markdown": "^6.5.0",
    "@codemirror/state": "^6.6.0",
    "@codemirror/theme-one-dark": "^6.1.3",
    "@codemirror/view": "^6.43.0",
    "markdown-it": "^14.1.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "vue-tsc": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

**移除：** `nuxt`

**脚本变化：**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview"
  }
}
```

### 5.3 Dockerfile

```dockerfile
# 构建阶段
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 5.4 环境变量

```bash
# .env
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_ENV=development
```

---

## 6. 文件迁移清单

| # | 操作 | 文件 | 说明 |
|---|------|------|------|
| 1 | 创建 | `vite.config.ts` | 替代 nuxt.config.ts |
| 2 | 创建 | `index.html` | Vite 入口 |
| 3 | 创建 | `src/main.ts` | Vue 应用启动 |
| 4 | 创建 | `src/router/index.ts` | 路由配置 |
| 5 | 创建 | `src/router/authGuard.ts` | 认证守卫 |
| 6 | 创建 | `env.d.ts` | Vite 类型声明 |
| 7 | 迁移 | `app/App.vue` → `src/App.vue` | NuxtLayout → router-view |
| 8 | 迁移 | `app/layouts/default.vue` → `src/layouts/DefaultLayout.vue` | slot → router-view |
| 9 | 迁移 | `app/layouts/admin.vue` → `src/layouts/AdminLayout.vue` | slot → router-view |
| 10 | 迁移 | `app/composables/useApi.ts` → `src/composables/useApi.ts` | 替换 $fetch、useRuntimeConfig |
| 11 | 迁移 | `app/middleware/admin.ts` → `src/router/authGuard.ts` | 改为纯函数 |
| 12-43 | 迁移 | `app/pages/*.vue` → `src/pages/*.vue` | 共 15 个页面文件，逐文件修改 |
| 44-47 | 迁移 | `app/components/*.vue` → `src/components/*.vue` | 4 个通用组件 |
| 48-51 | 迁移 | `app/assets/css/*.css` → `src/assets/css/*.css` | 不变 |
| 52 | 更新 | `package.json` | 替换依赖和脚本 |
| 53 | 更新 | `.env` | 前缀 NUXT_PUBLIC_ → VITE_ |
| 54 | 更新 | `Dockerfile` | 改为 nginx 静态构建 |
| 55 | 更新 | `README.md` | 改为 Vue 项目说明 |
| 56 | 删除 | `content/` | 未使用的 Nuxt Content |
| 57 | 删除 | `nuxt.config.ts` | 不再需要 |
| 58 | 删除 | `.nuxt/`, `.output/` | 构建缓存 |

---

## 7. 风险与注意事项

1. **`import.meta.client`** — Vite 中可继续使用，但若需要降级兼容，替换为 `typeof window !== 'undefined'`
2. **`useRoute('articles-slug')`** — Nuxt 的具名路由参数，需改为 `useRoute().params.slug`
3. **`definePageMeta({ layout: false })`** — admin/login.vue 和 workbench.vue 使用的是无布局模式，需确保路由不嵌套在布局中
4. **生产模式认证** — admin 页面在非 production 环境跳过认证，需在 authGuard 中保留 `VITE_APP_ENV` 检查
5. **构建产物路径** — Dockerfile 改为 `dist/`，需同步 `nginx.conf` 中的 root 路径
6. **性能** — 移除 `useAsyncData` 的 SSR 预取后，页面初次加载变为客户端请求，这是 SPA 模式的正常行为

---

## 8. 不变的部分（无需改动）

- 所有 CSS 文件（tokens/reset/typography/prose）
- 所有模板 HTML 结构和样式
- 组件逻辑（MarkdownEditor、ScrollReveal 等）
- useApi 的 API 方法签名（getArticles / createArticle 等）
- DESIGN.md 和 PRODUCT.md 设计文档
