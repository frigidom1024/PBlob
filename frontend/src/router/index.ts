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
