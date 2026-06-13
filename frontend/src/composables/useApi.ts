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
