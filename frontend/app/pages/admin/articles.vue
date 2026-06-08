<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const { data, refresh } = await useAsyncData('admin-articles-list', () => api.getArticles())
const articles = computed(() => data.value?.data || [])

async function togglePublish(article: any) {
  await api.updateArticle(article.id, { published: !article.published })
  refresh()
}

async function removeArticle(id: number) {
  if (!confirm('确定删除此文章？')) return
  await api.deleteArticle(id)
  refresh()
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="title">文章管理</h1>
        <p class="caption page-desc">共 {{ articles.length }} 篇文章</p>
      </div>
      <NuxtLink to="/admin/articles/new" class="page-btn label">写新文章</NuxtLink>
    </div>

    <div class="data-table">
      <div class="table-header">
        <span class="table-cell table-cell--wide">标题</span>
        <span class="table-cell">状态</span>
        <span class="table-cell">日期</span>
        <span class="table-cell">操作</span>
      </div>
      <div v-for="a in articles" :key="a.id" class="table-row">
        <span class="table-cell table-cell--wide">
          <NuxtLink :to="`/admin/articles/${a.id}`" class="table-title">{{ a.title }}</NuxtLink>
        </span>
        <span class="table-cell">
          <span :class="['badge', a.published ? 'badge--live' : 'badge--draft']">
            {{ a.published ? '已发布' : '草稿' }}
          </span>
        </span>
        <span class="table-cell caption">{{ new Date(a.created_at).toLocaleDateString('zh-CN') }}</span>
        <span class="table-cell table-actions">
          <NuxtLink :to="`/admin/articles/${a.id}`" class="action-link">编辑</NuxtLink>
          <button @click="togglePublish(a)" class="action-link">
            {{ a.published ? '下架' : '发布' }}
          </button>
          <button @click="removeArticle(a.id)" class="action-link action-link--danger">删除</button>
        </span>
      </div>
      <div v-if="!articles.length" class="table-empty caption">暂无文章</div>
    </div>
  </div>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-xl); }
.page-desc { margin-top: var(--space-2xs); color: var(--color-text-secondary); }
.page-btn { display: inline-flex; align-items: center; padding: var(--space-xs) var(--space-md); background: var(--color-text); color: var(--color-bg); transition: background var(--duration-fast); text-decoration: none; }
.page-btn:hover { background: var(--color-primary); }
.data-table { border: 1px solid var(--color-border); }
.table-header { display: grid; grid-template-columns: 1fr 80px 100px 160px; gap: var(--space-sm); padding: var(--space-sm) var(--space-md); background: var(--color-bg-alt); border-bottom: 1px solid var(--color-border); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; color: var(--color-text-secondary); }
.table-row { display: grid; grid-template-columns: 1fr 80px 100px 160px; gap: var(--space-sm); padding: var(--space-sm) var(--space-md); border-bottom: 1px solid var(--color-border); align-items: center; }
.table-row:last-child { border-bottom: none; }
.table-cell--wide { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.table-title { color: var(--color-text); transition: color var(--duration-fast); text-decoration: none; }
.table-title:hover { color: var(--color-primary); }
.badge { font-size: 0.65rem; padding: 0.2em 0.5em; white-space: nowrap; }
.badge--live { background: oklch(90% 0.1 150 / 0.3); color: oklch(40% 0.15 150); }
.badge--draft { background: var(--color-bg-alt); color: var(--color-text-secondary); }
.table-actions { display: flex; gap: var(--space-sm); }
.action-link { font-size: 0.8rem; color: var(--color-text-secondary); background: none; border: none; cursor: pointer; padding: 0; transition: color var(--duration-fast); text-decoration: none; }
.action-link:hover { color: var(--color-primary); }
.action-link--danger:hover { color: oklch(55% 0.2 30); }
.table-empty { padding: var(--space-xl); text-align: center; color: var(--color-text-secondary); }
</style>
