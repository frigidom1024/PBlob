<script setup lang="ts">
useHead({ title: 'Writing' })

const api = useApi()
const { data } = await useAsyncData('articles', () =>
  api.getArticles({ published: 1 })
)
const articles = computed(() => data.value?.data || [])
</script>

<template>
  <!-- ── Magazine section header ── -->
  <section class="toc-header">
    <div class="toc-header-inner">
      <span class="toc-section-marker label">Section 01</span>
      <h1 class="toc-title">
        <span class="toc-title-main">Writing</span>
        <span class="toc-title-count">{{ articles.length }}</span>
      </h1>
      <p class="toc-desc">Thoughts on life, design, code, and the spaces between.</p>
    </div>
    <div class="toc-header-line"></div>
  </section>

  <!-- ── Magazine table of contents ── -->
  <section class="toc-list">
    <!-- Cover story: first article gets hero treatment -->
    <article v-if="articles[0]" class="toc-cover-story">
      <span class="toc-kicker label">Cover Essay</span>
      <div class="toc-cover-story-body">
        <time class="toc-date" :datetime="articles[0].date">
          {{ new Date(articles[0].date).toLocaleDateString('zh-CN', {
            year: 'numeric', month: 'long', day: 'numeric'
          }) }}
        </time>
        <h2 class="display toc-cover-title">
          <NuxtLink :to="`/articles/${articles[0].slug}`">
            {{ articles[0].title }}
          </NuxtLink>
        </h2>
        <p class="toc-cover-excerpt">{{ articles[0].excerpt }}</p>
      </div>
    </article>

    <!-- Remaining articles: compact magazine listing -->
    <div class="toc-entries">
      <article
        v-for="article in articles.slice(1)"
        :key="article.id"
        class="toc-entry"
      >
        <span class="toc-entry-marker"></span>
        <div class="toc-entry-body">
          <time class="toc-entry-date caption" :datetime="article.date">
            {{ new Date(article.date).toLocaleDateString('zh-CN', {
              year: 'numeric', month: 'short', day: 'numeric'
            }) }}
          </time>
          <h3 class="title toc-entry-title">
            <NuxtLink :to="`/articles/${article.slug}`">
              {{ article.title }}
            </NuxtLink>
          </h3>
          <p class="caption toc-entry-excerpt">{{ article.excerpt }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
/* ════════════════════════════════════
   Magazine Header
   ════════════════════════════════════ */
.toc-header {
  background: var(--color-bg-alt);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-xl);
}

.toc-header-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-3xl) var(--content-padding) var(--space-lg);
}

.toc-section-marker {
  display: inline-block;
  margin-bottom: var(--space-md);
  color: var(--color-primary);
  letter-spacing: 0.12em;
}

.toc-title {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.toc-title-main {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(4rem, 10vw, 6rem);
  line-height: 0.9;
  letter-spacing: -0.03em;
}

.toc-title-count {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  line-height: 1;
  color: var(--color-primary);
  opacity: 0.4;
}

.toc-desc {
  max-width: var(--measure-narrow);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.toc-header-line {
  height: 1px;
  background: var(--color-border);
  max-width: var(--max-width);
  margin: 0 auto;
}

/* ════════════════════════════════════
   Cover Story
   ════════════════════════════════════ */
.toc-list {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-2xl) var(--content-padding) var(--space-3xl);
}

.toc-cover-story {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-xl);
  padding-bottom: var(--space-2xl);
  margin-bottom: var(--space-2xl);
  border-bottom: 2px solid var(--color-primary);
}

.toc-kicker {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  color: var(--color-primary);
  letter-spacing: 0.15em;
  font-size: 0.65rem;
  padding-top: 0.25rem;
}

.toc-cover-story-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.toc-date {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.toc-cover-title a {
  color: var(--color-text);
  transition: color var(--duration-fast) var(--ease-out-quart);
}

.toc-cover-title a:hover {
  color: var(--color-primary);
}

.toc-cover-excerpt {
  max-width: var(--measure-wide);
  font-size: clamp(1.0625rem, 1.25vw, 1.125rem);
  line-height: 1.7;
  color: var(--color-text-secondary);
}

/* ════════════════════════════════════
   Magazine Entries
   ════════════════════════════════════ */
.toc-entries {
  display: flex;
  flex-direction: column;
}

.toc-entry {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-md);
  padding: var(--space-lg) 0;
  border-bottom: 1px solid var(--color-border);
  transition: padding var(--duration-normal) var(--ease-out-quart);
}

.toc-entry:last-child {
  border-bottom: none;
}

.toc-entry:hover {
  padding-left: var(--space-sm);
}

.toc-entry-marker {
  width: 2px;
  background: transparent;
  transition: background var(--duration-normal) var(--ease-out-quart);
  flex-shrink: 0;
}

.toc-entry:hover .toc-entry-marker {
  background: var(--color-primary);
}

.toc-entry-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.toc-entry-date {
  color: var(--color-text-secondary);
}

.toc-entry-title a {
  color: var(--color-text);
  transition: color var(--duration-fast) var(--ease-out-quart);
}

.toc-entry-title a::after {
  content: ' →';
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out-quart);
}

.toc-entry:hover .toc-entry-title a::after {
  opacity: 1;
}

.toc-entry-title a:hover {
  color: var(--color-primary);
}

.toc-entry-excerpt {
  max-width: var(--measure-narrow);
  color: var(--color-text-secondary);
  margin-top: var(--space-3xs);
}

@media (max-width: 640px) {
  .toc-cover-story {
    grid-template-columns: 1fr;
  }
  .toc-kicker {
    writing-mode: horizontal-tb;
  }
}
</style>
