<script setup lang="ts">
import markdownit from 'markdown-it'

const route = useRoute('articles-slug')
const api = useApi()

const { data } = await useAsyncData(`article-${route.params.slug}`, () =>
  api.getArticle(route.params.slug as string)
)

const article = computed(() => data.value?.data || null)

const md = markdownit({ html: true, linkify: true, typographer: true })
const renderedContent = computed(() => article.value ? md.render(article.value.content || '') : '')

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found' })
}

useHead({
  title: article.value.title,
  meta: [{ name: 'description', content: article.value.excerpt }],
})
</script>

<template>
  <article v-if="article" class="article-spread">
    <!-- ── Magazine article header ── -->
    <header class="article-masthead">
      <div class="article-masthead-inner">
        <div class="article-meta-row">
          <time class="article-meta label" :datetime="article.date">
            {{ new Date(article.date).toLocaleDateString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric'
            }) }}
          </time>
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
  </article>
</template>

<style scoped>
/* ════════════════════════════════════
   Magazine Article Spread
   ════════════════════════════════════ */
.article-spread {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-3xl) var(--content-padding) var(--space-3xl);
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
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.article-meta {
  color: var(--color-text-secondary);
}

.article-tags {
  display: flex;
  gap: var(--space-2xs);
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
</style>
