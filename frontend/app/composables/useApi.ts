export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl

  function getAuthHeaders() {
    if (!import.meta.client) return {}
    const token = localStorage.getItem('admin_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function request<T = any>(path: string, opts: Record<string, any> = {}): Promise<T> {
    return $fetch<T>(`${baseURL}${path}`, {
      ...opts,
      headers: { ...getAuthHeaders(), ...opts.headers },
      onResponseError({ response }) {
        if (response.status === 401 && import.meta.client) {
          localStorage.removeItem('admin_token')
          navigateTo('/admin/login')
        }
      },
    })
  }

  return {
    // 公开方法
    async getArticles(params?: Record<string, any>) {
      return request('/api/articles', { params })
    },
    async getArticle(slug: string) {
      return request(`/api/articles/${slug}`)
    },
    async getProjects(params?: Record<string, any>) {
      return request('/api/projects', { params })
    },
    async getProject(id: number | string) {
      return request(`/api/projects/${id}`)
    },

    // 管理方法
    async createArticle(data: any) {
      return request('/api/articles', { method: 'POST', body: data })
    },
    async updateArticle(id: number, data: any) {
      return request(`/api/articles/${id}`, { method: 'PUT', body: data })
    },
    async deleteArticle(id: number) {
      return request(`/api/articles/${id}`, { method: 'DELETE' })
    },
    async createProject(data: any) {
      return request('/api/projects', { method: 'POST', body: data })
    },
    async updateProject(id: number, data: any) {
      return request(`/api/projects/${id}`, { method: 'PUT', body: data })
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
      return `${baseURL}/api/auth/github`
    },
  }
}
