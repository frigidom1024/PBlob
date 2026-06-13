<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  article: { id: number; slug: string; title: string; date: string; created_at: string; excerpt: string; category?: string; tags?: string[]; cover_image?: string }
  featured?: boolean
}>()

const slug = computed(() => props.article.slug || String(props.article.id))

const editorialDate = computed(() => {
  const d = new Date(props.article.date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <article :class="['article-card', { 'article-card--featured': featured }]">
    <div class="card-accent"></div>
    <div class="card-body">
      <div class="card-meta">
        <time class="card-date" :datetime="article.date">{{ editorialDate }}</time>
        <span v-if="article.category" class="card-category label">{{ article.category }}</span>
        <div v-if="article.tags?.length" class="card-tags">
          <span v-for="tag in article.tags.slice(0, 2)" :key="tag" class="card-tag label">{{ tag }}</span>
        </div>
      </div>
      <h2 :class="featured ? 'headline' : 'title'">
        <router-link :to="`/articles/${slug}`" class="card-link">
          {{ article.title }}
        </router-link>
      </h2>
      <p :class="['card-excerpt', { 'card-excerpt--wide': featured }]">{{ article.excerpt }}</p>
    </div>
  </article>
</template>

<style scoped>
.article-card {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg) 0;
  border-bottom: 1px solid var(--color-border);
  transition: padding var(--duration-normal) var(--ease-out-quart);
}
.article-card:first-child { padding-top: 0; }
.article-card:last-child { border-bottom: none; }
.article-card:hover { padding-left: var(--space-sm); }
.card-accent { width: 3px; flex-shrink: 0; background: transparent; transition: background var(--duration-normal) var(--ease-out-quart); }
.article-card:hover .card-accent { background: var(--color-primary); }
.article-card--featured .card-accent { background: var(--color-primary); }
.card-body { flex: 1; }
.card-meta { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-xs); }
.card-date { font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.4; }
.card-category { font-size: 0.7rem; padding: 0.15em 0.6em; background: oklch(48% 0.22 30 / 0.08); color: var(--color-primary); letter-spacing: 0.04em; font-weight: 500; }
.card-tags { display: flex; gap: var(--space-2xs); }
.card-tag { font-size: 0.625rem; padding: 0.25em 0.6em; background: var(--color-bg-alt); border: 1px solid var(--color-border); color: var(--color-text-secondary); }
.card-link { display: inline-block; transition: color var(--duration-fast) var(--ease-out-quart); }
.card-link::after { content: ' →'; opacity: 0; transition: opacity var(--duration-fast) var(--ease-out-quart); }
.article-card:hover .card-link::after { opacity: 1; }
.card-link:hover { color: var(--color-primary); }
.card-excerpt { margin-top: var(--space-xs); max-width: var(--measure-narrow); line-height: 1.5; color: var(--color-text-secondary); }
.card-excerpt--wide { max-width: var(--measure-wide); font-size: clamp(1rem, 1.25vw, 1.0625rem); }
</style>
