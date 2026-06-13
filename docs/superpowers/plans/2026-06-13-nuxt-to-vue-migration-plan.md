# Nuxt 3 → Vue 3 (Vite) Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Personal Blob frontend from Nuxt 3 to standard Vue 3 + Vite, preserving all components, pages, styles, and business logic.

**Architecture:** Convert Nuxt's equivalent setup (`app/` file-system routing, layouts with `<slot />`, `useAsyncData` SSR fetch, auto-imports, `useRuntimeConfig`) to standard equivalents (`src/`, `vue-router` manual config, `onMounted` + `ref`, explicit imports, Vite `import.meta.env`). Build output changes from Nuxt SSR (`.output/server/index.mjs`) to static `dist/` served by nginx.

**Tech Stack:** Vue 3, Vite 6, vue-router 5, @unhead/vue, codemirror 6, markdown-it

**Design doc:** `docs/superpowers/specs/2026-06-13-nuxt-to-vue-migration-design.md`

---

## File Structure

```
frontend/
├── src/
│   ├── assets/css/            ← copy from app/assets/css/ (unchanged)
│   ├── components/            ← copy from app/components/, add imports
│   │   ├── AdminSidebar.vue
│   │   ├── AppFooter.vue
│   │   ├── AppHeader.vue
│   │   ├── ArticleCard.vue
│   │   ├── MarkdownEditor.vue
│   │   ├── ProjectCard.vue
│   │   └── ScrollReveal.vue
│   ├── composables/
│   │   └── useApi.ts          ← rewrite: remove $fetch, useRuntimeConfig
│   ├── layouts/
│   │   ├── DefaultLayout.vue  ← migrate from app/layouts/default.vue
│   │   └── AdminLayout.vue    ← migrate from app/layouts/admin.vue
│   ├── router/
│   │   ├── index.ts           ← NEW (manual route config)
│   │   └── authGuard.ts       ← from app/middleware/admin.ts
│   ├── pages/                 ← migrate from app/pages/
│   │   ├── index.vue
│   │   ├── about.vue
│   │   ├── articles/
│   │   │   ├── index.vue
│   │   │   ├── library.vue
│   │   │   └── Slug.vue       ← was [slug].vue
│   │   ├── projects/
│   │   │   └── index.vue
│   │   └── admin/
│   │       ├── index.vue
│   │       ├── login.vue
│   │       ├── workbench.vue
│   │       ├── articles/
│   │       │   ├── index.vue
│   │       │   ├── create.vue
│   │       │   └── Id.vue     ← was [id].vue
│   │       └── projects/
│   │           ├── index.vue
│   │           ├── create.vue
│   │           └── Id.vue     ← was [id].vue
│   ├── App.vue                ← from app/app.vue
│   └── main.ts                ← NEW
├── public/favicon.ico         ← keep
├── .env                       ← update env var prefixes
├── index.html                 ← NEW
├── vite.config.ts             ← NEW (replaces nuxt.config.ts)
├── tsconfig.json              ← update
├── env.d.ts                   ← NEW
├── .gitignore                 ← update
├── Dockerfile                 ← rewrite
├── DESIGN.md                  ← keep
├── PRODUCT.md                 ← keep
└── README.md                  ← update
```

---

### Task 1: Install dependencies and create config files

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/tsconfig.json`
- Create: `frontend/env.d.ts`
- Create: `frontend/.gitignore`

- [ ] **Step 1: Update package.json**

Replace scripts and dependencies — remove `nuxt`, add `vite`, `@vitejs/plugin-vue`, `vue-tsc`, `@unhead/vue`:

```json
{
  "name": "personal-blob-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@codemirror/commands": "^6.10.3",
    "@codemirror/lang-markdown": "^6.5.0",
    "@codemirror/state": "^6.6.0",
    "@codemirror/theme-one-dark": "^6.1.3",
    "@codemirror/view": "^6.43.0",
    "@unhead/vue": "^2.0.0",
    "codemirror": "^6.0.2",
    "markdown-it": "^14.1.0",
    "vue": "^3.5.35",
    "vue-router": "^5.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "~5.7.0",
    "vite": "^6.0.0",
    "vue-tsc": "^2.2.0"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
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

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Personal Blob</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&display=swap" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

Google Font links moved here from the layout's `useHead()`.

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "env.d.ts"]
}
```

- [ ] **Step 5: Create env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 6: Update .gitignore**

```text
node_modules/
dist/
*.local
.env.local
```

- [ ] **Step 7: Install dependencies**

Run: `cd d:\project\personal blob\frontend && npm install`

Expected: packages install without errors. `nuxt` is no longer in node_modules.

- [ ] **Step 8: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/index.html frontend/tsconfig.json frontend/env.d.ts frontend/.gitignore
git commit -m "feat: scaffold Vite + Vue 3 project config"
```

---

### Task 2: Create router, auth guard, and main entry

**Files:**
- Create: `frontend/src/main.ts`
- Create: `frontend/src/router/index.ts`
- Create: `frontend/src/router/authGuard.ts`

- [ ] **Step 1: Create src/router/authGuard.ts**

```typescript
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'

export function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const isDev = import.meta.env.VITE_APP_ENV !== 'production'
  if (isDev) return next()

  // If URL has a token, save it and redirect without the token param
  if (to.query.token) {
    localStorage.setItem('admin_token', to.query.token as string)
    const { token: _, ...query } = to.query
    return next({ path: to.path, query })
  }

  const token = localStorage.getItem('admin_token')
  if (!token && to.path !== '/admin/login') {
    return next('/admin/login')
  }
  next()
}
```

- [ ] **Step 2: Create src/router/index.ts**

```typescript
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authGuard } from './authGuard'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      { path: '',           name: 'home',          component: () => import('@/pages/index.vue') },
      { path: 'about',      name: 'about',         component: () => import('@/pages/about.vue') },
      { path: 'articles',   name: 'articles',      component: () => import('@/pages/articles/index.vue') },
      { path: 'articles/library', name: 'library', component: () => import('@/pages/articles/library.vue') },
      { path: 'articles/:slug',  name: 'article-detail', component: () => import('@/pages/articles/Slug.vue') },
      { path: 'projects',   name: 'projects',      component: () => import('@/pages/projects/index.vue') },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    beforeEnter: authGuard,
    children: [
      { path: '',               name: 'admin-dashboard',    component: () => import('@/pages/admin/index.vue') },
      { path: 'login',          name: 'admin-login',        component: () => import('@/pages/admin/login.vue') },
      { path: 'workbench',      name: 'admin-workbench',    component: () => import('@/pages/admin/workbench.vue') },
      { path: 'articles',       name: 'admin-articles',     component: () => import('@/pages/admin/articles/index.vue') },
      { path: 'articles/create', name: 'admin-articles-create', component: () => import('@/pages/admin/articles/create.vue') },
      { path: 'articles/:id',   name: 'admin-articles-edit', component: () => import('@/pages/admin/articles/Id.vue') },
      { path: 'projects',       name: 'admin-projects',     component: () => import('@/pages/admin/projects/index.vue') },
      { path: 'projects/create', name: 'admin-projects-create', component: () => import('@/pages/admin/projects/create.vue') },
      { path: 'projects/:id',   name: 'admin-projects-edit', component: () => import('@/pages/admin/projects/Id.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

- [ ] **Step 3: Create src/main.ts**

```typescript
import { createApp } from 'vue'
import { createHead } from '@unhead/vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const head = createHead()

app.use(router)
app.use(head)
app.mount('#app')
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/main.ts frontend/src/router/index.ts frontend/src/router/authGuard.ts
git commit -m "feat: add router, auth guard, and Vue app entry"
```

---

### Task 3: Migrate layouts (App.vue, DefaultLayout, AdminLayout)

**Files:**
- Create: `frontend/src/App.vue`
- Create: `frontend/src/layouts/DefaultLayout.vue`
- Create: `frontend/src/layouts/AdminLayout.vue`

- [ ] **Step 1: Create src/App.vue**

```vue
<template>
  <router-view />
</template>
```

(From `app/app.vue`: `NuxtLayout` → `router-view`)

- [ ] **Step 2: Create src/layouts/DefaultLayout.vue**

The layout is nearly the same — replace `<slot />` with `<router-view />`, add Vue import for `useHead`, change CSS `@import` paths:

```vue
<script setup lang="ts">
import { useHead } from '@unhead/vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

useHead({
  titleTemplate: (title: string | null) => title ? `${title} — Personal Blob` : 'Personal Blob',
})
</script>

<template>
  <AppHeader />
  <main>
    <router-view />
  </main>
  <AppFooter />
</template>

<style>
@import url('@/assets/css/tokens.css');
@import url('@/assets/css/reset.css');
@import url('@/assets/css/typography.css');
@import url('@/assets/css/prose.css');
</style>
```

**Key changes from `app/layouts/default.vue`:**
- Added `import { useHead } from '@unhead/vue'`
- Added `import AppHeader` and `import AppFooter` (was auto-imported)
- Removed `useHead` `link` array (fonts moved to `index.html`)
- Replaced `<slot />` with `<router-view />`
- Changed `~/assets/css/...` to `@/assets/css/...`

- [ ] **Step 3: Create src/layouts/AdminLayout.vue**

```vue
<script setup lang="ts">
import { useHead } from '@unhead/vue'
import AdminSidebar from '@/components/AdminSidebar.vue'

useHead({ titleTemplate: (title: string | null) => title ? `${title} — Admin` : 'Admin — Personal Blob' })
</script>

<template>
  <div class="admin-shell">
    <AdminSidebar />
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<style>
@import url('@/assets/css/tokens.css');
@import url('@/assets/css/reset.css');
@import url('@/assets/css/typography.css');

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

**Key changes from `app/layouts/admin.vue`:**
- Added Vue/component imports
- Replaced `<slot />` with `<router-view />`
- Changed `~/assets/css/...` to `@/assets/css/...`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.vue frontend/src/layouts/DefaultLayout.vue frontend/src/layouts/AdminLayout.vue
git commit -m "feat: migrate layouts to vue-router"
```

---

### Task 4: Rewrite useApi composable

**Files:**
- Create: `frontend/src/composables/useApi.ts`
- Update: `frontend/.env`

- [ ] **Step 1: Update .env**

```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_ENV=development
```

(Changed `NUXT_PUBLIC_API_BASE_URL` → `VITE_API_BASE_URL`, `NUXT_PUBLIC_APP_ENV` → `VITE_APP_ENV`)

- [ ] **Step 2: Create src/composables/useApi.ts**

Replace `useRuntimeConfig()` + `$fetch()` with `import.meta.env` + native `fetch`:

```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const APP_ENV = import.meta.env.VITE_APP_ENV || 'development'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function useApi() {
  async function request<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(opts.body && typeof opts.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...getAuthHeaders(),
      ...(opts.headers as Record<string, string> || {}),
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      ...opts,
      headers,
    })

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('admin_token')
        window.location.href = '/admin/login'
      }
      const errBody = await res.json().catch(() => ({}))
      throw errBody
    }

    return res.json()
  }

  return {
    // 公开方法
    async getArticles(params?: Record<string, any>) {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request(`/api/articles${qs}`)
    },
    async getArticle(slug: string) {
      return request(`/api/articles/${slug}`)
    },
    async getProjects(params?: Record<string, any>) {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request(`/api/projects${qs}`)
    },
    async getProject(id: number | string) {
      return request(`/api/projects/${id}`)
    },

    // 管理方法
    async createArticle(data: any) {
      return request('/api/articles', { method: 'POST', body: JSON.stringify(data) })
    },
    async updateArticle(id: number, data: any) {
      return request(`/api/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    },
    async deleteArticle(id: number) {
      return request(`/api/articles/${id}`, { method: 'DELETE' })
    },
    async createProject(data: any) {
      return request('/api/projects', { method: 'POST', body: JSON.stringify(data) })
    },
    async updateProject(id: number, data: any) {
      return request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    },
    async deleteProject(id: number) {
      return request(`/api/projects/${id}`, { method: 'DELETE' })
    },

    // 上传
    async uploadImage(file: File) {
      const formData = new FormData()
      formData.append('file', file)
      return request('/api/upload', { method: 'POST', body: formData })
    },

    // 认证
    async getMe() {
      return request('/api/auth/me')
    },
    getLoginUrl() {
      return `${BASE_URL}/api/auth/github`
    },

    get isDev() {
      return APP_ENV !== 'production'
    },
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/composables/useApi.ts frontend/.env
git commit -m "feat: rewrite useApi composable with native fetch and env vars"
```

---

### Task 5: Migrate common components

**Files:** Create these under `frontend/src/components/`:
- `AppHeader.vue`
- `AppFooter.vue`
- `AdminSidebar.vue`
- `ScrollReveal.vue`
- `ArticleCard.vue`
- `ProjectCard.vue`

Each component needs these exact changes:
1. Add `import { ref, computed, onMounted } from 'vue'` where needed
2. Replace `NuxtLink` → `RouterLink`
3. Replace `navigateTo()` → `router.push()` (in AdminSidebar)
4. Replace `useRoute()` / `useRouter()` import source
5. Replace `'~/...'` path aliases → `'@/...'`
6. CSS `@import url('~/assets/...')` → `@import url('@/assets/...')`

- [ ] **Step 1: Migrate AppHeader.vue**

Copy from `app/components/AppHeader.vue`. Changes:
- Add `<script setup>` import: none needed (no Vue APIs used, only `NuxtLink` → `RouterLink`)

The script section is minimal — just a nav array. Replace `NuxtLink` with `RouterLink` in template.

```vue
<script setup lang="ts">
const nav = [
  { label: 'Home', href: '/' },
  { label: 'Writing', href: '/articles' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
]
</script>

<template>
  <header class="site-header">
    <nav class="header-inner">
      <router-link to="/" class="logo label">Personal Blob</router-link>
      <ul class="nav-list">
        <li v-for="item in nav" :key="item.href">
          <router-link :to="item.href" class="nav-link label">
            {{ item.label }}
          </router-link>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
/* ... same styles as original ... */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-sm) var(--content-padding);
}
.logo { font-size: 0.875rem; letter-spacing: 0.1em; font-weight: 600; transition: color var(--duration-fast) var(--ease-out-quart); }
.logo:hover { color: var(--color-primary); }
.nav-list { display: flex; gap: var(--space-lg); }
.nav-link { position: relative; font-size: 0.75rem; letter-spacing: 0.05em; color: var(--color-text-secondary); transition: color var(--duration-fast) var(--ease-out-quart); }
.nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: var(--color-primary); transition: width var(--duration-normal) var(--ease-out-quart); }
.nav-link:hover { color: var(--color-text); }
.nav-link:hover::after { width: 100%; }
</style>
```

- [ ] **Step 2: Migrate AppFooter.vue**

Copy from `app/components/AppFooter.vue`. No Nuxt-specific APIs used. No import changes needed.

- [ ] **Step 3: Migrate AdminSidebar.vue**

Copy from `app/components/AdminSidebar.vue`. Changes:
- `import { ref, onMounted } from 'vue'`
- `import { useRouter } from 'vue-router'`
- `RouterLink` instead of `NuxtLink`
- `navigateTo('/admin/login')` → `router.push('/admin/login')`
- `useRuntimeConfig()` → `import.meta.env.VITE_APP_ENV`
- Add explicit `import { useApi } from '@/composables/useApi'`

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'

const { getLoginUrl, getMe } = useApi()
const router = useRouter()

const token = ref('')
const user = ref<any>(null)
const isDev = import.meta.env.VITE_APP_ENV !== 'production'

onMounted(async () => {
  if (isDev) {
    user.value = { id: 0, github_login: 'dev-user', avatar_url: '' }
    return
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
  router.push('/admin/login')
}

const nav = [
  { label: '仪表盘', icon: '⊞', to: '/admin' },
  { label: '文章', icon: '✎', to: '/admin/articles' },
  { label: '项目', icon: '◧', to: '/admin/projects' },
  { label: '写作台', icon: '✎', to: '/admin/workbench' },
]
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <router-link to="/admin" class="sidebar-logo label">Personal Blob</router-link>
      <span class="sidebar-badge label">Admin</span>
    </div>
    <nav class="sidebar-nav">
      <router-link
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="sidebar-link label"
      >
        <span class="sidebar-icon">{{ item.icon }}</span>
        {{ item.label }}
      </router-link>
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
/* ... same styles as original ... */
</style>
```

- [ ] **Step 4: Migrate ScrollReveal.vue**

Copy from `app/components/ScrollReveal.vue`. Add `import { ref, onMounted } from 'vue'`.

The original already uses `ref` and `onMounted` from Vue (auto-imported by Nuxt). Now they need explicit imports.

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  stagger?: boolean
  delay?: number
}>(), {
  stagger: false,
  delay: 0,
})

const el = ref<HTMLElement | null>(null)
const staggerDelay = props.stagger ? 120 : 0

onMounted(() => {
  if (!el.value || !('IntersectionObserver' in window)) return
  const children = Array.from(el.value.children)
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const child = entry.target as HTMLElement
          const index = children.indexOf(child)
          const delay = index * staggerDelay + props.delay
          child.style.transitionDelay = `${delay}ms`
          child.style.opacity = '1'
          child.style.transform = 'translateY(0)'
          observer.unobserve(child)
        }
      }
    },
    { threshold: 0.1 },
  )
  for (const child of children) {
    ;(child as HTMLElement).style.opacity = '0'
    ;(child as HTMLElement).style.transform = 'translateY(24px)'
    ;(child as HTMLElement).style.transition =
      'opacity 600ms var(--ease-out-expo), transform 600ms var(--ease-out-expo)'
    observer.observe(child)
  }
})
</script>

<template>
  <div ref="el">
    <slot />
  </div>
</template>
```

- [ ] **Step 5: Migrate ArticleCard.vue**

Copy from `app/components/ArticleCard.vue`. Add `import { computed } from 'vue'`, replace `NuxtLink` → `RouterLink`.

```vue
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  article: { id: number; slug: string; title: string; date: string; created_at: string; excerpt: string; category?: string; tags?: string[]; cover_image?: string }
  featured?: boolean
}>()

const slug = computed(() => props.article.slug || String(props.article.id))

const editorialDate = computed(() => {
  const d = new Date(props.article.date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <article :class="['article-card', { 'article-card--featured': featured }]">
    <div class="card-accent"></div>
    <div class="card-body">
      <div class="card-meta">
        <time class="card-date" :datetime="article.date">{{ editorialDate }}</time>
        <span v-if="article.category" class="card-category label">{{ article.category }}</span>
        <div v-if="article.tags?.length" class="card-tags">
          <span v-for="tag in article.tags.slice(0, 2)" :key="tag" class="card-tag label">{{ tag }}</span>
        </div>
      </div>
      <h2 :class="featured ? 'headline' : 'title'">
        <router-link :to="`/articles/${slug}`" class="card-link">
          {{ article.title }}
        </router-link>
      </h2>
      <p :class="['card-excerpt', { 'card-excerpt--wide': featured }]">{{ article.excerpt }}</p>
    </div>
  </article>
</template>

<style scoped>
/* ... same styles as original ... */
</style>
```

- [ ] **Step 6: Migrate ProjectCard.vue**

Copy from `app/components/ProjectCard.vue`. No Nuxt-specific APIs used. Template stays identical.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: migrate common components with explicit imports"
```

---

### Task 6: Migrate MarkdownEditor

**Files:**
- Create: `frontend/src/components/MarkdownEditor.vue`

This component needs special attention because it uses `import.meta.client` for dynamic import of `markdown-it`.

- [ ] **Step 1: Create src/components/MarkdownEditor.vue**

Add Vue imports, keep the codemirror setup, adjust the `markdown-it` import:

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import MarkdownIt from 'markdown-it'

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

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

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
/* ... same styles as original ... */
</style>
```

**Key changes from `app/components/MarkdownEditor.vue`:**
- Added Vue imports: `ref`, `onMounted`, `onBeforeUnmount`, `watch`
- Changed `import.meta.client` + dynamic import to static import of `markdown-it`

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/MarkdownEditor.vue
git commit -m "feat: migrate MarkdownEditor with static import"
```

---

### Task 7: Migrate CSS assets

**Files:**
- Create: `frontend/src/assets/css/tokens.css` ← copy from `app/assets/css/tokens.css`
- Create: `frontend/src/assets/css/reset.css` ← copy from `app/assets/css/reset.css`
- Create: `frontend/src/assets/css/typography.css` ← copy from `app/assets/css/typography.css`
- Create: `frontend/src/assets/css/prose.css` ← copy from `app/assets/css/prose.css`

- [ ] **Step 1: Copy CSS files**

Copy the 4 CSS files from `app/assets/css/` to `src/assets/css/`. Content is unchanged — these are pure design tokens and styles with no Nuxt dependencies.

Run:
```bash
mkdir -p frontend/src/assets/css
cp frontend/app/assets/css/*.css frontend/src/assets/css/
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/assets/css/
git commit -m "chore: copy CSS assets"
```

---

### Task 8: Migrate public pages

**Files:** Create under `frontend/src/pages/`:
- `index.vue` (homepage)
- `about.vue`
- `articles/index.vue`
- `articles/library.vue`
- `articles/Slug.vue` (was `[slug].vue`)
- `projects/index.vue`

Each page needs the same set of changes:
1. Add Vue imports: `import { ref, computed, onMounted, reactive, watch, nextTick } from 'vue'` as needed
2. Add component imports for ArticleCard, ProjectCard, ScrollReveal, MarkdownEditor
3. Add `import { useRoute, useRouter } from 'vue-router'` where needed
4. Add `import { useHead } from '@unhead/vue'`
5. Add `import { useApi } from '@/composables/useApi'`
6. Replace `useAsyncData` → `onMounted` + `ref`
7. Replace `navigateTo()` → `router.push()`
8. Replace `createError()` → `notFound` flag
9. Replace `NuxtLink` → `RouterLink`
10. Replace `useRoute('articles-slug')` → `useRoute().params.slug`

- [ ] **Step 1: Migrate pages/index.vue (homepage)**

Changes:
- Add imports: `import { ref, computed, onMounted } from 'vue'`
- Add imports: `import { useHead } from '@unhead/vue'`, `import { useApi } from '@/composables/useApi'`
- Add imports: `import ScrollReveal from '@/components/ScrollReveal.vue'`, `import ArticleCard from '@/components/ArticleCard.vue'`, `import ProjectCard from '@/components/ProjectCard.vue'`
- Replace `useAsyncData` → `onMounted` + `ref`
- Replace `NuxtLink` → `RouterLink`

New `<script setup>`:

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useApi } from '@/composables/useApi'
import ScrollReveal from '@/components/ScrollReveal.vue'
import ArticleCard from '@/components/ArticleCard.vue'
import ProjectCard from '@/components/ProjectCard.vue'

const api = useApi()

const articlesData = ref<any>({ data: [] })
const projectsData = ref<any>({ data: [] })

onMounted(async () => {
  const [aRes, pRes] = await Promise.all([
    api.getArticles({ published: 1 }),
    api.getProjects({ published: 1 }),
  ])
  articlesData.value = aRes
  projectsData.value = pRes
})

const articles = computed(() => (articlesData.value?.data || []).slice(0, 2))
const projects = computed(() => (projectsData.value?.data || []).slice(0, 2))
</script>
```

Template: replace all `NuxtLink` → `RouterLink`. The `<RouterLink>` component has the same `to` prop as `NuxtLink` — `:to="..."` stays identical.

- [ ] **Step 2: Migrate pages/about.vue**

Same pattern: add imports, replace `useAsyncData` → `onMounted`, replace `NuxtLink` → `RouterLink`.

- [ ] **Step 3: Migrate pages/articles/index.vue**

Changes:
- Add all necessary imports
- Replace `useAsyncData` → `onMounted` + `ref` for both `recentData` and `allData`
- Replace `NuxtLink` → `RouterLink`

- [ ] **Step 4: Migrate pages/articles/library.vue**

Changes:
- Add imports
- Replace `useAsyncData` → `onMounted` + `ref`
- `useRoute()` and `useRouter()` now from `vue-router`
- Replace `NuxtLink` → `RouterLink`
- Call `refresh()` manually after URL update

- [ ] **Step 5: Migrate pages/articles/Slug.vue (was [slug].vue)**

Changes:
- Add imports
- Replace `useAsyncData` → `onMounted` + `ref`
- `useRoute('articles-slug')` → `import { useRoute } from 'vue-router'` + `route.params.slug`
- Replace `createError()` with `notFound` flag
- Replace `NuxtLink` → `RouterLink`

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useApi } from '@/composables/useApi'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const api = useApi()
const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

const article = ref<any>(null)
const relatedArticles = ref<any[]>([])
const notFound = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.getArticle(route.params.slug as string)
    article.value = data
    if (!article.value) {
      notFound.value = true
      return
    }
    // Fetch related
    if (article.value?.category) {
      const relatedRes = await api.getArticles({ published: 1, category: article.value.category, per_page: 4 })
      relatedArticles.value = (relatedRes.data || [])
        .filter((a: any) => a.slug !== route.params.slug)
        .slice(0, 3)
    }
  } catch {
    notFound.value = true
  }
})

const renderedContent = computed(() =>
  article.value ? md.render(article.value.content || '') : '',
)

useHead({
  title: article.value?.title || 'Article',
  meta: article.value?.excerpt
    ? [{ name: 'description', content: article.value.excerpt }]
    : [],
})

const readingTime = computed(() => {
  if (!article.value?.content) return '1'
  const words = article.value.content.length
  const minutes = Math.max(1, Math.ceil(words / 500))
  return String(minutes)
})
</script>
```

Template: `NuxtLink` → `RouterLink` (all uses).

- [ ] **Step 6: Migrate pages/projects/index.vue**

Same changes as other public pages: imports, `onMounted` data fetching, `RouterLink`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/index.vue frontend/src/pages/about.vue frontend/src/pages/articles/ frontend/src/pages/projects/
git commit -m "feat: migrate public pages to Vue patterns"
```

---

### Task 9: Migrate admin login and dashboard pages

**Files:** Create under `frontend/src/pages/admin/`:
- `login.vue`
- `index.vue`

- [ ] **Step 1: Migrate admin/login.vue**

Changes:
- Remove `definePageMeta({ layout: false })` — now handled by route (not nested in DefaultLayout)
- Add imports
- `useRuntimeConfig()` → `import.meta.env.VITE_APP_ENV`
- `navigateTo('/admin')` → `router.push('/admin')`

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'

const { getLoginUrl } = useApi()
const route = useRoute()
const router = useRouter()

const isDev = import.meta.env.VITE_APP_ENV !== 'production'
if (isDev) {
  router.push('/admin')
}

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
      <a :href="getLoginUrl()" class="login-btn label">Login with GitHub</a>
    </div>
  </div>
</template>

<style scoped>
/* ... same styles as original ... */
</style>
```

- [ ] **Step 2: Migrate admin/index.vue (dashboard)**

Changes:
- Remove `definePageMeta({ layout: 'admin', middleware: 'admin' })`
- Add imports
- Replace `useAsyncData` → `onMounted` + `ref`
- Replace `NuxtLink` → `RouterLink`

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

const articles = ref<any[]>([])
const projects = ref<any[]>([])
const user = ref<any>(null)

onMounted(async () => {
  try {
    const [aRes, pRes, uRes] = await Promise.all([
      api.getArticles(),
      api.getProjects(),
      api.getMe(),
    ])
    articles.value = aRes.data || []
    projects.value = pRes.data || []
    user.value = uRes.data || null
  } catch { /* ignore */ }
})

const publishedArticles = computed(() => articles.value.filter((a: any) => a.published).length)
const publishedProjects = computed(() => projects.value.filter((p: any) => p.published).length)
</script>
```

Template: `NuxtLink` → `RouterLink`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/login.vue frontend/src/pages/admin/index.vue
git commit -m "feat: migrate admin login and dashboard"
```

---

### Task 10: Migrate admin articles CRUD pages

**Files:** Create under `frontend/src/pages/admin/articles/`:
- `index.vue`
- `create.vue`
- `Id.vue` (was `[id].vue`)

- [ ] **Step 1: Migrate admin/articles/index.vue**

Changes:
- Remove `definePageMeta({ layout: 'admin', middleware: 'admin' })`
- Add imports
- Replace `useAsyncData` → `onMounted` + `ref`
- Replace `NuxtLink` → `RouterLink`

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()
const articles = ref<any[]>([])

onMounted(async () => {
  try {
    const res = await api.getArticles()
    articles.value = res.data || []
  } catch { /* ignore */ }
})

async function togglePublish(article: any) {
  await api.updateArticle(article.id, { published: !article.published })
  // Re-fetch
  const res = await api.getArticles()
  articles.value = res.data || []
}

async function removeArticle(id: number) {
  if (!confirm('确定删除此文章？')) return
  await api.deleteArticle(id)
  const res = await api.getArticles()
  articles.value = res.data || []
}
</script>
```

Template: `NuxtLink` → `RouterLink`.

- [ ] **Step 2: Migrate admin/articles/create.vue**

Changes:
- Remove `definePageMeta({ layout: 'admin', middleware: 'admin' })`
- Add imports
- Replace `navigateTo('/admin/articles')` → `router.push('/admin/articles')`

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

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
    form.slug = form.title.toLowerCase().replace(/[^\w一-鿿]+/g, '-').replace(/^-+|-+$/g, '')
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
```

Template: no changes needed (no NuxtLink in this template).

- [ ] **Step 3: Migrate admin/articles/Id.vue (was [id].vue)**

Changes:
- Remove `definePageMeta({ layout: 'admin', middleware: 'admin' })`
- Add imports
- Replace `useAsyncData` → `onMounted` + `ref`
- Replace `navigateTo('/admin/articles')` → `router.push('/admin/articles')`

```vue
<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

const api = useApi()
const router = useRouter()
const route = useRoute()

const article = ref<any>(null)
const loading = ref(true)

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

onMounted(async () => {
  try {
    const res = await api.getArticle(route.params.id as string)
    article.value = res.data
    if (article.value) {
      form.title = article.value.title || ''
      form.slug = article.value.slug || ''
      form.excerpt = article.value.excerpt || ''
      form.content = article.value.content || ''
      form.tags = (article.value.tags || []).join(', ')
      form.cover_image = article.value.cover_image || ''
      form.published = !!article.value.published
    }
  } catch { /* ignore */ }
  finally { loading.value = false }
})

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
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/admin/articles/
git commit -m "feat: migrate admin articles CRUD pages"
```

---

### Task 11: Migrate admin projects CRUD pages

**Files:** Create under `frontend/src/pages/admin/projects/`:
- `index.vue`
- `create.vue`
- `Id.vue` (was `[id].vue`)

Changes are identical in pattern to the articles CRUD:
- Remove `definePageMeta`
- Add Vue imports
- Replace `useAsyncData` → `onMounted` + `ref`
- Replace `navigateTo()` → `router.push()`
- Replace `NuxtLink` → `RouterLink`

- [ ] **Step 1–3: Create admin/projects/index.vue, create.vue, Id.vue**

Follow the same pattern as Task 10. Each file: import Vue APIs, use `onMounted` for data fetching, use `router.push()` for navigation, `RouterLink` for links.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/admin/projects/
git commit -m "feat: migrate admin projects CRUD pages"
```

---

### Task 12: Migrate workbench page

**Files:**
- Create: `frontend/src/pages/admin/workbench.vue`

This is the largest file (~1144 lines). The changes are mechanical but numerous.

- [ ] **Step 1: Create src/pages/admin/workbench.vue**

Changes from `app/pages/admin/workbench.vue`:
1. Remove `definePageMeta({ layout: false })`
2. Add Vue imports at top
3. `import { useApi } from '@/composables/useApi'`
4. `import { useRouter } from 'vue-router'`
5. Replace `navigateTo('/admin')` → `router.push('/admin')`
6. Replace `NuxtLink` → `RouterLink`

```vue
<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const api = useApi()
const router = useRouter()

const CATEGORIES = ['技术', '阅读', '故事', '随笔'] as const

// ── State ──
const articles = ref<any[]>([])
const currentId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)
const saveStatus = ref<'saved' | 'unsaved' | 'saving'>('saved')
const autoSaveEnabled = ref(true)
const searchQuery = ref('')
const selectedCategory = ref<string>('')
const filterStatus = ref<'all' | 'published' | 'draft'>('all')
const showSidebar = ref(true)
const showMeta = ref(false)
const showSettings = ref(false)
const draftsExpanded = ref(true)
const archivedExpanded = ref(false)
const activeActivity = ref<'explorer' | 'search'>('explorer')

// Form state
const formTitle = ref('')
const formSlug = ref('')
const formContent = ref('')
const formExcerpt = ref('')
const formCategory = ref('随笔')
const formTags = ref('')
const formCoverImage = ref('')
const formPublished = ref(false)
const textareaEl = ref<HTMLTextAreaElement | null>(null)

// ── Computed ──
const filteredArticles = computed(() => {
  let list = articles.value
  if (selectedCategory.value) list = list.filter((a: any) => a.category === selectedCategory.value)
  if (filterStatus.value === 'published') list = list.filter((a: any) => a.published)
  else if (filterStatus.value === 'draft') list = list.filter((a: any) => !a.published)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((a: any) => a.title.toLowerCase().includes(q))
  }
  return list
})

const draftsByCategory = computed(() => {
  const map: Record<string, any[]> = {}
  for (const a of articles.value) {
    if (a.published) continue
    const cat = a.category || '随笔'
    if (!map[cat]) map[cat] = []
    map[cat].push(a)
  }
  return map
})

const publishedByCategory = computed(() => {
  const map: Record<string, any[]> = {}
  for (const a of articles.value) {
    if (!a.published) continue
    const cat = a.category || '随笔'
    if (!map[cat]) map[cat] = []
    map[cat].push(a)
  }
  return map
})

const isEditing = computed(() => currentId.value !== null)
const isNewArticle = ref(false)

const lineCount = computed(() => {
  if (!formContent.value) return 1
  return formContent.value.split('\n').length
})

const charCount = computed(() => formContent.value.length)

const lineNumbers = computed(() => {
  const count = Math.max(lineCount.value, 1)
  return Array.from({ length: count }, (_, i) => i + 1)
})

// ── Lifecycle ──
onMounted(async () => {
  await fetchArticles()
})

// ── API ──
async function fetchArticles() {
  loading.value = true
  try {
    const res = await api.getArticles()
    articles.value = res.data || []
    if (articles.value.length > 0 && !currentId.value && !isNewArticle.value) {
      selectArticle(articles.value[0].id)
    }
  } catch { /* ignore */ }
  finally { loading.value = false }
}

async function selectArticle(id: number) {
  if (currentId.value === id && !isNewArticle.value) return
  saveCurrentBeforeSwitch()
  isNewArticle.value = false
  currentId.value = id
  const article = articles.value.find((a: any) => a.id === id)
  if (article) {
    try {
      const res = await api.getArticle(article.slug)
      const a = res.data
      formTitle.value = a.title || ''
      formSlug.value = a.slug || ''
      formExcerpt.value = a.excerpt || ''
      formContent.value = a.content || ''
      formCategory.value = a.category || '随笔'
      formTags.value = (a.tags || []).join(', ')
      formCoverImage.value = a.cover_image || ''
      formPublished.value = !!a.published
      saveStatus.value = 'saved'
      nextTick(() => syncScroll())
    } catch { /* ignore */ }
  }
}

async function createNewArticle() {
  saveCurrentBeforeSwitch()
  isNewArticle.value = true
  currentId.value = null
  formTitle.value = ''
  formSlug.value = ''
  formExcerpt.value = ''
  formContent.value = ''
  formCategory.value = '随笔'
  formTags.value = ''
  formCoverImage.value = ''
  formPublished.value = false
  saveStatus.value = 'unsaved'
  showSidebar.value = true
}

async function saveCurrentArticle(publish?: boolean) {
  if (!formTitle.value && !formContent.value) return
  saving.value = true
  saveStatus.value = 'saving'
  const tags = formTags.value ? formTags.value.split(',').map((t: string) => t.trim()).filter(Boolean) : []

  try {
    if (isNewArticle.value) {
      const res = await api.createArticle({
        title: formTitle.value || '未命名文章',
        slug: formSlug.value || undefined,
        excerpt: formExcerpt.value,
        content: formContent.value,
        category: formCategory.value,
        tags,
        cover_image: formCoverImage.value || null,
        published: publish ?? formPublished.value,
      })
      isNewArticle.value = false
      currentId.value = res.data.id
      await fetchArticles()
    } else if (currentId.value) {
      await api.updateArticle(currentId.value, {
        title: formTitle.value || '未命名文章',
        slug: formSlug.value || undefined,
        excerpt: formExcerpt.value,
        content: formContent.value,
        category: formCategory.value,
        tags,
        cover_image: formCoverImage.value || null,
        published: publish ?? formPublished.value,
      })
      await fetchArticles()
    }
    formPublished.value = publish ?? formPublished.value
    saveStatus.value = 'saved'
  } catch {
    saveStatus.value = 'unsaved'
  } finally {
    saving.value = false
  }
}

async function deleteArticle(id: number) {
  if (!confirm('删除后不可恢复，确定？')) return
  try {
    await api.deleteArticle(id)
    if (currentId.value === id) {
      currentId.value = null
      isNewArticle.value = false
      formTitle.value = ''
      formContent.value = ''
    }
    await fetchArticles()
  } catch { /* ignore */ }
}

function saveCurrentBeforeSwitch() {
  if (saveStatus.value === 'unsaved' && (formTitle.value || formContent.value)) {
    saveCurrentArticle()
  }
}

// ── Editor ──
function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  formContent.value = target.value
  saveStatus.value = 'unsaved'
  debouncedAutoSave()
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    saveCurrentArticle()
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
    e.preventDefault()
    showSidebar.value = !showSidebar.value
  }
}

const gutterEl = ref<HTMLElement | null>(null)
function syncScroll() {
  if (textareaEl.value && gutterEl.value) {
    gutterEl.value.scrollTop = textareaEl.value.scrollTop
  }
}

const debouncedAutoSave = debounce(() => {
  if (autoSaveEnabled.value && (currentId.value || isNewArticle.value)) saveCurrentArticle()
}, 3000)

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !textareaEl.value) return
  try {
    const res = await api.uploadImage(file)
    const url = res.data.url
    const start = textareaEl.value.selectionStart
    const end = textareaEl.value.selectionEnd
    const before = formContent.value.slice(0, start)
    const after = formContent.value.slice(end)
    formContent.value = `${before}![img](${url})\n${after}`
    saveStatus.value = 'unsaved'
    nextTick(() => {
      textareaEl.value!.selectionStart = textareaEl.value!.selectionEnd = start + url.length + 9
      textareaEl.value!.focus()
    })
  } catch { /* ignore */ }
  input.value = ''
}

const titleInput = ref<HTMLInputElement | null>(null)
watch(isNewArticle, (v) => {
  if (v) nextTick(() => titleInput.value?.focus())
})
</script>
```

Template: Replace `NuxtLink` → `RouterLink`. Only one `RouterLink` in the template:
```diff
- <NuxtLink to="/admin" class="activity-icon" title="返回后台">
+ <router-link to="/admin" class="activity-icon" title="返回后台">
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/workbench.vue
git commit -m "feat: migrate workbench page"
```

---

### Task 13: Update Dockerfile

**Files:**
- Modify: `frontend/Dockerfile`

- [ ] **Step 1: Rewrite Dockerfile**

Replace Nuxt SSR build with static Vite build + nginx:

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: Update docker-compose.prod.yml (if needed)**

Check if `docker-compose.prod.yml` references the frontend. The frontend service may need to expose port 80 instead of 3000.

- [ ] **Step 3: Commit**

```bash
git add frontend/Dockerfile
git commit -m "chore: update Dockerfile for static Vite build"
```

---

### Task 14: Clean up old Nuxt files

**Files to delete:**
- `frontend/nuxt.config.ts`
- `frontend/app/` (entire directory — files have been migrated to `src/`)
- `frontend/content/` (unused)
- `frontend/.nuxt/` (build cache)
- `frontend/.output/` (build output)

- [ ] **Step 1: Delete old files**

Run:
```bash
rm -f frontend/nuxt.config.ts
rm -rf frontend/app
rm -rf frontend/content
rm -rf frontend/.nuxt
rm -rf frontend/.output
```

- [ ] **Step 2: Update README.md**

Rewrite the Nuxt Content starter README to describe the Vue 3 project:

```markdown
# Personal Blob — Frontend

Vue 3 + Vite frontend for Personal Blob.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Opens at `http://localhost:5173`.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Preview

```bash
npm run preview
```
```

- [ ] **Step 3: Commit**

```bash
git rm -r frontend/nuxt.config.ts frontend/app frontend/content
git rm -r frontend/.nuxt frontend/.output 2>/dev/null || true
git add frontend/README.md
git commit -m "chore: clean up Nuxt files and update README"
```

---

### Task 15: Verify build

- [ ] **Step 1: Install dependencies and build**

Run:
```bash
cd d:/project/personal\ blob/frontend
npm run build
```

Expected: `vue-tsc` type-checks pass, `vite build` outputs to `dist/`.

- [ ] **Step 2: Check for any remaining Nuxt references**

Run:
```bash
cd d:/project/personal\ blob/frontend
grep -r "useRuntimeConfig\|useAsyncData\|definePageMeta\|defineNuxtRouteMiddleware\|NuxtLayout\|NuxtLink\|navigateTo\|createError\|useFetch\|~/assets" src/ --include="*.vue" --include="*.ts" || echo "No Nuxt references found"
```

Expected: No matches.

- [ ] **Step 3: Verify dist/ output exists**

Run:
```bash
ls -la frontend/dist/index.html
```

Expected: `dist/index.html` exists along with `dist/assets/`.
