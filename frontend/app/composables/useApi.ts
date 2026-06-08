import { ofetch } from 'ofetch'
import type { FetchOptions } from 'ofetch'

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl

  const api = ofetch.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    onResponseError({ response }) {
      if (response.status === 401) {
        const token = localStorage.getItem('admin_token')
        if (token) {
          localStorage.removeItem('admin_token')
          navigateTo('/admin/login')
        }
      }
    },
  } as FetchOptions)

  function getAuthHeaders() {
    const token = localStorage.getItem('admin_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  return {
    // 公开方法
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

    // 管理方法
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
