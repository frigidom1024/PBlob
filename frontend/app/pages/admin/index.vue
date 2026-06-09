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
        <NuxtLink to="/admin/articles/create" class="dash-card-action label">写新文章 →</NuxtLink>
      </div>
      <div class="dash-card">
        <span class="dash-card-icon">✎</span>
        <span class="dash-card-num">{{ articles.length + projects.length }}</span>
        <span class="dash-card-label label">写作工作台</span>
        <NuxtLink to="/admin/workbench" class="dash-card-action label">打开写作台 →</NuxtLink>
      </div>
      <div class="dash-card">
        <span class="dash-card-icon">◧</span>
        <span class="dash-card-num">{{ projects.length }}</span>
        <span class="dash-card-label label">项目 ({{ publishedProjects }} 已发布)</span>
        <NuxtLink to="/admin/projects/create" class="dash-card-action label">添加项目 →</NuxtLink>
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
