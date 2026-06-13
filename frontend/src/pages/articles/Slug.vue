<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useApi } from '@/composables/useApi'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const api = useApi()
const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

const article = ref<any>(null)
const relatedArticles = ref<any[]>([])
const notFound = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.getArticle(route.params.slug as string)
    article.value = data
    if (!article.value) {
      notFound.value = true
      return
    }
    if (article.value?.category) {
      const relatedRes = await api.getArticles({ published: 1, category: article.value.category, per_page: 4 })
      relatedArticles.value = (relatedRes.data || [])
        .filter((a: any) => a.slug !== route.params.slug)
        .slice(0, 3)
    }
  } catch {
    notFound.value = true
  }
})

const renderedContent = computed(() =>
  article.value ? md.render(article.value.content || '') : '',
)

useHead({
  title: article.value?.title || 'Article',
  meta: article.value?.excerpt
    ? [{ name: 'description', content: article.value.excerpt }]
    : [],
})

const readingTime = computed(() => {
  if (!article.value?.content) return '1'
  const words = article.value.content.length
  const minutes = Math.max(1, Math.ceil(words / 500))
  return String(minutes)
})
</script>

<template>
  <article v-if="article" class="article-spread">
    <!-- ── Back to Writing ── -->
    <router-link to="/articles" class="back-link label">← Writing</router-link>

    <!-- ── Magazine article header ── -->
    <header class="article-masthead">
      <div class="article-masthead-inner">
        <div class="article-meta-row">
          <time class="article-meta label" :datetime="article.date">
            {{ new Date(article.date).toLocaleDateString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric'
            }) }}
          </time>
          <span v-if="article.category" class="article-meta-sep"></span>
          <router-link
            v-if="article.category"
            :to="`/articles?cat=${article.category}`"
            class="article-category label"
          >{{ article.category }}</router-link>
          <span class="article-meta-sep"></span>
          <span class="article-meta label">{{ readingTime }} min read</span>
          <div v-if="article.tags?.length" class="article-tags">
            <span v-for="tag in article.tags" :key="tag" class="article-tag label">{{ tag }}</span>
          </div>
        </div>
        <div class="article-title-block">
          <div class="article-title-accent"></div>
          <div class="article-title-text">
            <h1 class="display article-title">{{ article.title }}</h1>
            <p v-if="article.excerpt" class="article-deck">{{ article.excerpt }}</p>
          </div>
        </div>
      </div>
      <div class="article-header-bar"></div>
    </header>

    <!-- ── Editorial content ── -->
    <div class="article-body prose mag-prose">
      <div v-html="renderedContent"></div>
    </div>

    <!-- ── Article Footer ── -->
    <footer class="article-footer">
      <div class="footer-bar"></div>

      <div class="footer-meta">
        <div class="footer-meta-left">
          <span class="footer-label label">Published</span>
          <time :datetime="article.date">
            {{ new Date(article.date).toLocaleDateString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric'
            }) }}
          </time>
          <span v-if="article.category" class="footer-sep"></span>
          <router-link v-if="article.category" :to="`/articles?cat=${article.category}`" class="footer-cat">
            {{ article.category }}
          </router-link>
        </div>
        <div v-if="article.tags?.length" class="footer-meta-right">
          <span v-for="tag in article.tags" :key="tag" class="footer-tag caption">{{ tag }}</span>
        </div>
      </div>

      <!-- Related articles -->
      <div v-if="relatedArticles.length > 0" class="footer-related">
        <span class="footer-related-label label">
          More from <router-link :to="`/articles?cat=${article.category}`" class="footer-related-cat">{{ article.category }}</router-link>
        </span>
        <div class="footer-related-grid">
          <router-link
            v-for="related in relatedArticles"
            :key="related.id"
            :to="`/articles/${related.slug}`"
            class="related-card"
          >
            <span class="related-card-title">{{ related.title }}</span>
            <span class="related-card-date caption">{{ new Date(related.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }}</span>
          </router-link>
        </div>
      </div>

      <div class="footer-bottom-nav">
        <router-link to="/articles" class="footer-back-link label">← All Writing</router-link>
      </div>
    </footer>
  </article>
</template>

<style scoped>
/* ════════════════════════════════════
   Magazine Article Spread
   ════════════════════════════════════ */
.article-spread {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-xl) var(--content-padding) var(--space-3xl);
}

/* ── Back link ── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  letter-spacing: 0.03em;
  margin-bottom: var(--space-lg);
  transition: color var(--duration-fast);
}
.back-link:hover {
  color: var(--color-primary);
}

/* ── Masthead ── */
.article-masthead {
  margin-bottom: var(--space-2xl);
}

.article-masthead-inner {
  max-width: var(--measure-wide);
}

.article-meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.article-meta {
  color: var(--color-text-secondary);
  font-size: 0.7rem;
}

.article-meta-sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-border);
  flex-shrink: 0;
}

.article-category {
  font-size: 0.75rem;
  color: var(--color-primary);
  text-decoration: none;
  padding: 0.2em 0.6em;
  background: oklch(48% 0.26 25 / 0.08);
  transition: all var(--duration-fast);
  letter-spacing: 0.04em;
  font-weight: 500;
}
.article-category:hover {
  background: oklch(48% 0.26 25 / 0.18);
}

.article-tags {
  display: flex;
  gap: var(--space-2xs);
  flex-wrap: wrap;
}

.article-tag {
  font-size: 0.625rem;
  padding: 0.3em 0.7em;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.article-title-block {
  display: flex;
  gap: var(--space-md);
}

.article-title-accent {
  width: 4px;
  background: var(--color-primary);
  flex-shrink: 0;
}

.article-title-text {
  flex: 1;
}

.article-title {
  margin-bottom: var(--space-md);
  text-wrap: balance;
  letter-spacing: -0.02em;
}

.article-deck {
  font-size: clamp(1.125rem, 1.5vw, 1.35rem);
  line-height: 1.6;
  color: var(--color-text-secondary);
  max-width: var(--measure-wide);
}

.article-header-bar {
  width: 80px;
  height: 2px;
  background: var(--color-primary);
  margin-top: var(--space-xl);
}

/* ── Body ── */
.article-body {
  margin: 0;
  max-width: var(--measure-body);
}

/* ════════════════════════════════════
   Article Footer
   ════════════════════════════════════ */
.article-footer {
  max-width: var(--measure-body);
  margin-top: var(--space-3xl);
}

.footer-bar {
  width: 100%;
  height: 2px;
  background: var(--color-primary);
  margin-bottom: var(--space-xl);
}

/* Meta section */
.footer-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.footer-meta-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.footer-label {
  font-size: 0.65rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.05em;
}

.footer-meta-left time {
  font-size: 0.85rem;
  color: var(--color-text);
}

.footer-sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-border);
}

.footer-cat {
  font-size: 0.8rem;
  color: var(--color-primary);
  text-decoration: none;
  transition: opacity var(--duration-fast);
}
.footer-cat:hover {
  opacity: 0.7;
}

.footer-tag {
  font-size: 0.65rem;
  padding: 0.2em 0.5em;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

/* Related section */
.footer-related {
  padding: var(--space-xl) 0;
  border-bottom: 1px solid var(--color-border);
}

.footer-related-label {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.05em;
  margin-bottom: var(--space-md);
}

.footer-related-cat {
  color: var(--color-primary);
  text-decoration: none;
}
.footer-related-cat:hover {
  text-decoration: underline;
}

.footer-related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-md);
}

.related-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  text-decoration: none;
  transition: all var(--duration-normal);
}
.related-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.related-card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
  transition: color var(--duration-fast);
}
.related-card:hover .related-card-title {
  color: var(--color-primary);
}

.related-card-date {
  font-size: 0.65rem;
  color: var(--color-text-secondary);
}

/* Bottom nav */
.footer-bottom-nav {
  display: flex;
  justify-content: center;
  padding: var(--space-lg) 0;
}

.footer-back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  letter-spacing: 0.03em;
  transition: color var(--duration-fast);
}
.footer-back-link:hover {
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .article-spread {
    padding: var(--space-md) var(--content-padding) var(--space-2xl);
  }
  .footer-related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
