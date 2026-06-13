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
