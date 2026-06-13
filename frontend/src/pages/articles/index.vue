<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useApi } from '@/composables/useApi'
import ScrollReveal from '@/components/ScrollReveal.vue'

useHead({ title: 'Writing' })

const CATEGORIES = ['技术', '阅读', '故事', '随笔'] as const
const LIST_LIMIT = 10
const CAT_LIMIT = 3

const api = useApi()

const recentData = ref<any>(null)
const allData = ref<any>(null)

onMounted(async () => {
  const [recentRes, allRes] = await Promise.all([
    api.getArticles({ published: 1, per_page: LIST_LIMIT }),
    api.getArticles({ published: 1 }),
  ])
  recentData.value = recentRes
  allData.value = allRes
})

const recentArticles = computed(() => recentData.value?.data || [])
const totalCount = computed(() => (recentData.value as any)?.total || 0)

const allArticles = computed(() => allData.value?.data || [])
const articlesByCategory = computed(() => {
  const map: Record<string, any[]> = {}
  for (const cat of CATEGORIES) map[cat] = []
  for (const a of allArticles.value) {
    const cat = a.category || '随笔'
    if (map[cat]) map[cat].push(a)
  }
  return map
})

const hasCategory = (cat: string) => (articlesByCategory.value[cat]?.length || 0) > 0
</script>

<template>
  <!-- ═══════ Magazine Header ═══════ -->
  <section class="toc-header">
    <div class="toc-header-inner">
      <span class="toc-section-marker label">Section 01</span>
      <h1 class="toc-title">
        <span class="toc-title-main">Writing</span>
        <span class="toc-title-count">{{ totalCount }}</span>
      </h1>
      <p class="toc-desc">Thoughts on life, design, code, and the spaces between.</p>
    </div>
    <div class="toc-header-line"></div>
  </section>

  <!-- ═══════ Main Magazine Listing ═══════ -->
  <section class="toc-list">
    <article v-if="recentArticles[0]" class="toc-cover-story">
      <span class="toc-kicker label">Cover Essay</span>
      <div class="toc-cover-story-body">
        <time class="toc-date" :datetime="recentArticles[0].date">
          {{ new Date(recentArticles[0].date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) }}
        </time>
        <h2 class="display toc-cover-title">
          <router-link :to="`/articles/${recentArticles[0].slug}`">{{ recentArticles[0].title }}</router-link>
        </h2>
        <p class="toc-cover-excerpt">{{ recentArticles[0].excerpt }}</p>
      </div>
    </article>

    <div class="toc-entries">
      <article v-for="article in recentArticles.slice(1)" :key="article.id" class="toc-entry">
        <span class="toc-entry-marker"></span>
        <div class="toc-entry-body">
          <time class="toc-entry-date caption" :datetime="article.date">
            {{ new Date(article.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) }}
          </time>
          <h3 class="title toc-entry-title">
            <router-link :to="`/articles/${article.slug}`">{{ article.title }}</router-link>
          </h3>
          <p class="caption toc-entry-excerpt">{{ article.excerpt }}</p>
        </div>
      </article>
    </div>

    <!-- All articles link -->
    <router-link to="/articles/library" class="toc-more label">Browse all articles →</router-link>
  </section>

  <!-- ═══════ Category Columns ═══════ -->

  <!-- ▸ 技术 · Terminal ── dark, code-like, monospace -->
  <ScrollReveal v-if="hasCategory('技术')">
    <section class="col-tech">
      <div class="col-header">
        <span class="col-number">01</span>
        <span class="col-label label">技术 · Terminal</span>
        <span class="col-count caption">{{ articlesByCategory['技术'].length }}篇</span>
      </div>
      <div class="col-divider"></div>
      <div class="col-tech-grid">
        <router-link
          v-for="(a, i) in articlesByCategory['技术'].slice(0, CAT_LIMIT)"
          :key="a.id"
          :to="`/articles/${a.slug}`"
          class="tech-card"
          :style="{ '--i': i }"
        >
          <span class="tech-prompt">$</span>
          <div class="tech-body">
            <time class="tech-date caption">{{ new Date(a.date).toLocaleDateString('zh-CN') }}</time>
            <h3 class="tech-title">{{ a.title }}</h3>
            <p class="tech-excerpt caption">{{ a.excerpt }}</p>
          </div>
        </router-link>
      </div>
      <div v-if="articlesByCategory['技术'].length > CAT_LIMIT" class="col-more">
        <router-link to="/articles/library?cat=%E6%8A%80%E6%9C%AF" class="col-more-link label">View all {{ articlesByCategory['技术'].length - CAT_LIMIT }} more →</router-link>
      </div>
    </section>
  </ScrollReveal>

  <!-- ▸ 阅读 · Bookshelf ── warm, paper-like, generous -->
  <ScrollReveal v-if="hasCategory('阅读')" :delay="120">
    <section class="col-read">
      <div class="col-header">
        <span class="col-number">02</span>
        <span class="col-label label">阅读 · Bookshelf</span>
        <span class="col-count caption">{{ articlesByCategory['阅读'].length }}篇</span>
      </div>
      <div class="col-divider"></div>
      <div class="col-read-stack">
        <router-link
          v-for="(a, i) in articlesByCategory['阅读'].slice(0, CAT_LIMIT)"
          :key="a.id"
          :to="`/articles/${a.slug}`"
          class="read-entry"
          :style="{'--offset': i}"
        >
          <div class="read-num label">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="read-body">
            <h3 class="read-title">{{ a.title }}</h3>
            <p class="read-excerpt caption">{{ a.excerpt }}</p>
            <time class="read-date caption">{{ new Date(a.date).toLocaleDateString('zh-CN') }}</time>
          </div>
          <span class="read-arrow">→</span>
        </router-link>
      </div>
      <div v-if="articlesByCategory['阅读'].length > CAT_LIMIT" class="col-more">
        <router-link to="/articles/library?cat=%E9%98%85%E8%AF%BB" class="col-more-link label">View all {{ articlesByCategory['阅读'].length - CAT_LIMIT }} more →</router-link>
      </div>
    </section>
  </ScrollReveal>

  <!-- ▸ 故事 · Timeline ── alternating, axis line -->
  <ScrollReveal v-if="hasCategory('故事')" :delay="240">
    <section class="col-story">
      <div class="col-header">
        <span class="col-number">03</span>
        <span class="col-label label">故事 · Timeline</span>
        <span class="col-count caption">{{ articlesByCategory['故事'].length }}篇</span>
      </div>
      <div class="col-divider"></div>
      <div class="col-story-axis">
        <router-link
          v-for="(a, i) in articlesByCategory['故事'].slice(0, CAT_LIMIT)"
          :key="a.id"
          :to="`/articles/${a.slug}`"
          :class="['story-entry', i % 2 === 0 ? 'left' : 'right']"
          :style="{'--i': i}"
        >
          <div class="story-dot"></div>
          <div class="story-card">
            <time class="story-date caption">{{ new Date(a.date).toLocaleDateString('zh-CN') }}</time>
            <h3 class="story-title">{{ a.title }}</h3>
            <p class="story-excerpt caption">{{ a.excerpt }}</p>
          </div>
        </router-link>
      </div>
      <div v-if="articlesByCategory['故事'].length > CAT_LIMIT" class="col-more">
        <router-link to="/articles/library?cat=%E6%95%85%E4%BA%8B" class="col-more-link label">View all {{ articlesByCategory['故事'].length - CAT_LIMIT }} more →</router-link>
      </div>
    </section>
  </ScrollReveal>

  <!-- ▸ 随笔 · Scroll ── minimal, airy, magazine -->
  <ScrollReveal v-if="hasCategory('随笔')" :delay="360">
    <section class="col-essay">
      <div class="col-header">
        <span class="col-number">04</span>
        <span class="col-label label">随笔 · Scroll</span>
        <span class="col-count caption">{{ articlesByCategory['随笔'].length }}篇</span>
      </div>
      <div class="col-divider"></div>
      <div class="col-essay-list">
        <router-link
          v-for="(a, i) in articlesByCategory['随笔'].slice(0, CAT_LIMIT)"
          :key="a.id"
          :to="`/articles/${a.slug}`"
          class="essay-entry"
          :style="{'--i': i}"
        >
          <div class="essay-accent"></div>
          <div class="essay-body">
            <time class="essay-date caption">{{ new Date(a.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' }) }}</time>
            <h3 class="essay-title">{{ a.title }}</h3>
            <p class="essay-excerpt caption">{{ a.excerpt }}</p>
          </div>
          <span class="essay-arrow">→</span>
        </router-link>
      </div>
      <div v-if="articlesByCategory['随笔'].length > CAT_LIMIT" class="col-more">
        <router-link to="/articles/library?cat=%E9%9A%8F%E7%AC%94" class="col-more-link label">View all {{ articlesByCategory['随笔'].length - CAT_LIMIT }} more →</router-link>
      </div>
    </section>
  </ScrollReveal>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   Magazine Header
   ═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   Magazine Listing
   ═══════════════════════════════════════════ */
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

.toc-date { font-size: 0.875rem; color: var(--color-text-secondary); }

.toc-cover-title a {
  color: var(--color-text);
  transition: color var(--duration-fast) var(--ease-out-quart);
}
.toc-cover-title a:hover { color: var(--color-primary); }

.toc-cover-excerpt {
  max-width: var(--measure-wide);
  font-size: clamp(1.0625rem, 1.25vw, 1.125rem);
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.toc-entries { display: flex; flex-direction: column; }

.toc-entry {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-md);
  padding: var(--space-lg) 0;
  border-bottom: 1px solid var(--color-border);
  transition: padding var(--duration-normal) var(--ease-out-quart);
}
.toc-entry:last-child { border-bottom: none; }
.toc-entry:hover { padding-left: var(--space-sm); }

.toc-entry-marker {
  width: 2px;
  background: transparent;
  transition: background var(--duration-normal) var(--ease-out-quart);
  flex-shrink: 0;
}
.toc-entry:hover .toc-entry-marker { background: var(--color-primary); }

.toc-entry-body { display: flex; flex-direction: column; gap: var(--space-2xs); }
.toc-entry-date { color: var(--color-text-secondary); }

.toc-entry-title a {
  color: var(--color-text);
  transition: color var(--duration-fast) var(--ease-out-quart);
}
.toc-entry-title a::after {
  content: ' →';
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out-quart);
}
.toc-entry:hover .toc-entry-title a::after { opacity: 1; }
.toc-entry-title a:hover { color: var(--color-primary); }

.toc-entry-excerpt {
  max-width: var(--measure-narrow);
  color: var(--color-text-secondary);
  margin-top: var(--space-3xs);
}

.toc-more {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  margin-top: var(--space-lg);
  padding: var(--space-xs) var(--space-md);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.75rem;
  transition: all var(--duration-fast);
}
.toc-more:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .toc-cover-story { grid-template-columns: 1fr; }
  .toc-kicker { writing-mode: horizontal-tb; }
}

/* ═══════════════════════════════════════════
   Shared Column Header
   ═══════════════════════════════════════════ */
.col-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.col-number {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
  color: var(--color-primary);
  letter-spacing: -0.03em;
}

.col-label {
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
}

.col-count {
  color: var(--color-text-secondary);
  margin-left: auto;
}

.col-divider {
  width: clamp(60px, 10vw, 120px);
  height: 2px;
  background: var(--color-primary);
  margin-bottom: var(--space-xl);
}

/* ═══════════════════════════════════════════
   01 ─ 技术 · Terminal
   Dark, code-like, monospace
   ═══════════════════════════════════════════ */
.col-tech {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-3xl) var(--content-padding);
}

.col-tech-grid {
  display: grid;
  gap: 1px;
  background: var(--color-border);
  border: 1px solid var(--color-border);
}

.tech-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: oklch(15% 0.005 30);
  text-decoration: none;
  transition: background var(--duration-normal);
  animation: fadeSlideUp 0.6s var(--ease-out-quart) both;
  animation-delay: calc(var(--i, 0) * 0.1s);
}

.tech-card:hover {
  background: oklch(20% 0.005 30);
}

.tech-prompt {
  font-family: var(--font-mono);
  color: oklch(55% 0.2 140);
  font-size: 1rem;
  line-height: 1.8;
  flex-shrink: 0;
}

.tech-body { flex: 1; }

.tech-date {
  font-family: var(--font-mono);
  color: oklch(45% 0.005 30);
  font-size: 0.65rem;
}

.tech-title {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 600;
  color: oklch(85% 0.005 30);
  margin: var(--space-2xs) 0;
  transition: color var(--duration-fast);
}
.tech-card:hover .tech-title { color: oklch(65% 0.2 140); }

.col-more {
  padding: var(--space-md) 0 0;
}

.col-more-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--duration-fast);
}
.col-more-link:hover { color: var(--color-primary); }

.tech-excerpt {
  font-family: var(--font-mono);
  color: oklch(50% 0.005 30);
  font-size: 0.75rem;
  line-height: 1.6;
}

/* ═══════════════════════════════════════════
   02 ─ 阅读 · Bookshelf
   Warm, paper-like, generous
   ═══════════════════════════════════════════ */
.col-read {
  background: var(--color-bg-alt);
  padding: var(--space-3xl) var(--content-padding);
}

.col-read .col-header,
.col-read .col-divider {
  max-width: var(--max-width);
  margin-left: auto;
  margin-right: auto;
}

.col-read .col-divider {
  margin-bottom: var(--space-xl);
}

.col-read-stack {
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.read-entry {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  text-decoration: none;
  transition: all var(--duration-normal);
  animation: fadeSlideUp 0.6s var(--ease-out-quart) both;
  animation-delay: calc(var(--offset, 0) * 0.08s);
}
.read-entry:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px oklch(0% 0 0 / 0.06);
}

.read-num {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
  opacity: 0.3;
  width: 48px;
  flex-shrink: 0;
}

.read-body { flex: 1; }

.read-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2xs);
  transition: color var(--duration-fast);
}
.read-entry:hover .read-title { color: var(--color-primary); }

.read-excerpt {
  color: var(--color-text-secondary);
  max-width: var(--measure-narrow);
  margin-bottom: var(--space-2xs);
}

.read-date {
  color: var(--color-text-secondary);
  font-size: 0.7rem;
}

.read-arrow {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  opacity: 0;
  transition: all var(--duration-normal);
}
.read-entry:hover .read-arrow {
  opacity: 1;
  transform: translateX(4px);
  color: var(--color-primary);
}

/* ═══════════════════════════════════════════
   03 ─ 故事 · Timeline
   Alternating, axis line
   ═══════════════════════════════════════════ */
.col-story {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-3xl) var(--content-padding);
}

.col-story-axis {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.col-story-axis::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-border);
  transform: translateX(-50%);
}

.story-entry {
  position: relative;
  display: flex;
  align-items: flex-start;
  width: 100%;
  text-decoration: none;
  animation: fadeSlideUp 0.6s var(--ease-out-quart) both;
  animation-delay: calc(var(--i, 0) * 0.12s);
}

.story-entry.left {
  padding-right: calc(50% + var(--space-xl));
  justify-content: flex-end;
}

.story-entry.right {
  padding-left: calc(50% + var(--space-xl));
  margin-left: auto;
}

.story-dot {
  position: absolute;
  left: 50%;
  top: var(--space-lg);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid var(--color-bg);
  transform: translateX(-50%);
  z-index: 1;
  transition: transform var(--duration-normal);
}
.story-entry:hover .story-dot {
  transform: translateX(-50%) scale(1.3);
}

.story-card {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--color-border);
  transition: all var(--duration-normal);
}
.story-card:hover {
  border-color: var(--color-primary);
}

.story-date {
  color: var(--color-text-secondary);
  font-size: 0.7rem;
}

.story-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: var(--space-2xs) 0;
  transition: color var(--duration-fast);
}
.story-card:hover .story-title { color: var(--color-primary); }

.story-excerpt {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  line-height: 1.5;
}

/* ═══════════════════════════════════════════
   04 ─ 随笔 · Scroll
   Minimal, airy, magazine
   ═══════════════════════════════════════════ */
.col-essay {
  background: var(--color-bg-alt);
  padding: var(--space-3xl) var(--content-padding);
}

.col-essay .col-header,
.col-essay .col-divider {
  max-width: var(--max-width);
  margin-left: auto;
  margin-right: auto;
}

.col-essay .col-divider {
  margin-bottom: var(--space-xl);
}

.col-essay-list {
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.essay-entry {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-lg) 0;
  border-bottom: 1px solid var(--color-border);
  text-decoration: none;
  transition: padding var(--duration-normal);
  animation: fadeSlideUp 0.5s var(--ease-out-quart) both;
  animation-delay: calc(var(--i, 0) * 0.06s);
}
.essay-entry:last-child { border-bottom: none; }
.essay-entry:hover { padding-left: var(--space-sm); }

.essay-accent {
  width: 3px;
  flex-shrink: 0;
  background: transparent;
  transition: background var(--duration-normal);
}
.essay-entry:hover .essay-accent { background: var(--color-primary); }

.essay-body { flex: 1; }

.essay-date {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.essay-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
  margin: var(--space-2xs) 0;
  transition: color var(--duration-fast);
}
.essay-entry:hover .essay-title { color: var(--color-primary); }

.essay-excerpt {
  color: var(--color-text-secondary);
  max-width: var(--measure-narrow);
}

.essay-arrow {
  font-size: 1rem;
  color: var(--color-text-secondary);
  opacity: 0;
  transition: all var(--duration-normal);
  margin-top: var(--space-xs);
}
.essay-entry:hover .essay-arrow {
  opacity: 1;
  transform: translateX(4px);
  color: var(--color-primary);
}

/* ═══════════════════════════════════════════
   Shared Animation
   ═══════════════════════════════════════════ */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .story-entry.left,
  .story-entry.right {
    padding-left: var(--space-xl);
    padding-right: 0;
    margin-left: 0;
  }
  .col-story-axis::before { left: 6px; }
  .story-dot { left: 6px; }
}
</style>
