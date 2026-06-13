<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'

useHead({ title: 'Article Library' })

const CATEGORIES = ['技术', '阅读', '故事', '随笔'] as const
const api = useApi()
const route = useRoute()
const router = useRouter()

const page = ref(Number(route.query.page) || 1)
const category = ref((route.query.cat as string) || '')
const search = ref((route.query.q as string) || '')
const perPage = 12

const data = ref<any>(null)

async function loadArticles() {
  const result = await api.getArticles({ published: 1, page: page.value, per_page: perPage, category: category.value || undefined })
  data.value = result
}

onMounted(() => {
  loadArticles()
})

const articles = computed(() => data.value?.data || [])
const total = computed(() => (data.value as any)?.total || 0)
const totalPages = computed(() => Math.ceil(total.value / perPage))

async function refresh() {
  await loadArticles()
}

function goToPage(n: number) {
  page.value = n
  updateUrl()
}

function setCategory(cat: string) {
  category.value = cat
  page.value = 1
  updateUrl()
}

function doSearch() {
  page.value = 1
  updateUrl()
}

function updateUrl() {
  const query: Record<string, any> = {}
  if (page.value > 1) query.page = page.value
  if (category.value) query.cat = category.value
  if (search.value) query.q = search.value
  router.push({ query })
  refresh()
}
</script>

<template>
  <div class="library">
    <!-- ── Header ── -->
    <div class="lib-header">
      <div class="lib-header-left">
        <router-link to="/articles" class="lib-back label">← Writing</router-link>
        <h1 class="display lib-title">Library</h1>
        <span class="lib-count caption">{{ total }} articles</span>
      </div>
    </div>

    <!-- ── Filters ── -->
    <div class="lib-filters">
      <div class="lib-cats">
        <button :class="['lib-cat label', { active: !category }]" @click="setCategory('')">All</button>
        <button v-for="cat in CATEGORIES" :key="cat" :class="['lib-cat label', { active: category === cat }]" @click="setCategory(cat)">{{ cat }}</button>
      </div>
      <div class="lib-search">
        <input v-model="search" class="lib-input caption" placeholder="Search articles..." @keydown.enter="doSearch" />
        <button class="lib-search-btn label" @click="doSearch">Search</button>
      </div>
    </div>

    <!-- ── Grid ── -->
    <div v-if="articles.length > 0" class="lib-grid">
      <router-link
        v-for="a in articles"
        :key="a.id"
        :to="`/articles/${a.slug}`"
        class="lib-card"
      >
        <div class="lib-card-top">
          <span class="lib-card-cat caption">{{ a.category }}</span>
          <span class="lib-card-date caption">{{ new Date(a.date).toLocaleDateString('zh-CN') }}</span>
        </div>
        <h2 class="lib-card-title">{{ a.title }}</h2>
        <p class="lib-card-excerpt caption">{{ a.excerpt }}</p>
        <div class="lib-card-bottom">
          <div v-if="a.tags?.length" class="lib-card-tags">
            <span v-for="t in a.tags.slice(0, 2)" :key="t" class="lib-tag caption">{{ t }}</span>
          </div>
          <span class="lib-card-arrow">→</span>
        </div>
      </router-link>
    </div>

    <div v-else class="lib-empty caption">No articles found.</div>

    <!-- ── Pagination ── -->
    <div v-if="totalPages > 1" class="lib-pages">
      <button :disabled="page <= 1" class="lib-page-btn label" @click="goToPage(page - 1)">← Prev</button>
      <template v-for="p in totalPages" :key="p">
        <button
          v-if="p === 1 || p === totalPages || Math.abs(p - page) <= 2"
          :class="['lib-page label', { active: p === page }]"
          @click="goToPage(p)"
        >{{ p }}</button>
        <span v-else-if="p === page - 3 || p === page + 3" class="lib-page-dots">...</span>
      </template>
      <button :disabled="page >= totalPages" class="lib-page-btn label" @click="goToPage(page + 1)">Next →</button>
    </div>
  </div>
</template>

<style scoped>
.library {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-3xl) var(--content-padding) var(--space-3xl);
}

/* ── Header ── */
.lib-header {
  margin-bottom: var(--space-xl);
}

.lib-header-left {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
}

.lib-back {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--duration-fast);
}
.lib-back:hover { color: var(--color-primary); }

.lib-title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(3rem, 6vw, 4.5rem);
  line-height: 0.9;
  letter-spacing: -0.03em;
}

.lib-count {
  color: var(--color-text-secondary);
}

/* ── Filters ── */
.lib-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.lib-cats {
  display: flex;
  gap: var(--space-2xs);
  flex-wrap: wrap;
}

.lib-cat {
  padding: 0.3em 0.9em;
  font-size: 0.75rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
  letter-spacing: 0.04em;
  font-weight: 500;
}
.lib-cat:hover {
  color: var(--color-primary);
  background: oklch(48% 0.22 30 / 0.06);
}
.lib-cat.active {
  background: var(--color-primary);
  color: var(--color-reversed);
}

.lib-search {
  display: flex;
  gap: var(--space-2xs);
}

.lib-input {
  padding: var(--space-2xs) var(--space-xs);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.8rem;
  width: 180px;
  transition: border-color var(--duration-fast);
}
.lib-input::placeholder { color: var(--color-text-secondary); }
.lib-input:focus { outline: none; border-color: var(--color-primary); }

.lib-search-btn {
  padding: var(--space-2xs) var(--space-sm);
  background: var(--color-text);
  color: var(--color-bg);
  border: none;
  cursor: pointer;
  font-size: 0.7rem;
  transition: background var(--duration-fast);
}
.lib-search-btn:hover { background: var(--color-primary); }

/* ── Grid ── */
.lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.lib-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  text-decoration: none;
  transition: all var(--duration-normal);
}
.lib-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.lib-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.lib-card-cat {
  font-size: 0.7rem;
  padding: 0.15em 0.6em;
  background: oklch(48% 0.22 30 / 0.08);
  color: var(--color-primary);
  letter-spacing: 0.04em;
  font-weight: 500;
}

.lib-card-date {
  font-size: 0.65rem;
  color: var(--color-text-secondary);
}

.lib-card-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.35;
  transition: color var(--duration-fast);
}
.lib-card:hover .lib-card-title { color: var(--color-primary); }

.lib-card-excerpt {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.lib-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: var(--space-xs);
}

.lib-card-tags {
  display: flex;
  gap: var(--space-2xs);
}

.lib-tag {
  font-size: 0.65rem;
  padding: 0.15em 0.5em;
  background: var(--color-bg-alt);
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.lib-card-arrow {
  font-size: 1rem;
  color: var(--color-text-secondary);
  opacity: 0;
  transition: all var(--duration-normal);
}
.lib-card:hover .lib-card-arrow {
  opacity: 1;
  transform: translateX(4px);
  color: var(--color-primary);
}

.lib-empty {
  text-align: center;
  padding: var(--space-3xl);
  color: var(--color-text-secondary);
  border: 1px dashed var(--color-border);
}

/* ── Pagination ── */
.lib-pages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
  padding: var(--space-xl) 0;
}

.lib-page {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all var(--duration-fast);
}
.lib-page:hover { border-color: var(--color-primary); color: var(--color-primary); }
.lib-page.active { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-reversed); }

.lib-page-dots {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  width: 24px;
  text-align: center;
}

.lib-page-btn {
  padding: 0.3em 0.8em;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 0.7rem;
  transition: all var(--duration-fast);
}
.lib-page-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.lib-page-btn:disabled { opacity: 0.3; cursor: default; }
</style>
