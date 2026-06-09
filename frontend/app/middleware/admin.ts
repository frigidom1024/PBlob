export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.client) {
    const config = useRuntimeConfig()
    // 非 production 环境跳过认证
    if (config.public.appEnv !== 'production') return

    // 如果 URL 里有 token，先保存到 localStorage
    if (to.query.token) {
      localStorage.setItem('admin_token', to.query.token as string)
      // 去掉 URL 上的 token 参数，重新跳转
      const { token, ...query } = to.query
      return navigateTo({ path: to.path, query })
    }

    const token = localStorage.getItem('admin_token')
    if (!token && to.path !== '/admin/login') {
      return navigateTo('/admin/login')
    }
  }
})
