export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.client) {
    const config = useRuntimeConfig()
    // 非 production 环境跳过认证
    if (config.public.appEnv !== 'production') return

    const token = localStorage.getItem('admin_token')
    if (!token && to.path !== '/admin/login') {
      return navigateTo('/admin/login')
    }
  }
})
