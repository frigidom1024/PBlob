<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useApi } from '@/composables/useApi'
import ScrollReveal from '@/components/ScrollReveal.vue'
import ArticleCard from '@/components/ArticleCard.vue'
import ProjectCard from '@/components/ProjectCard.vue'

const api = useApi()

const articlesData = ref<any>(null)
const projectsData = ref<any>(null)

onMounted(async () => {
  const [articlesRes, projectsRes] = await Promise.all([
    api.getArticles({ published: 1 }),
    api.getProjects({ published: 1 }),
  ])
  articlesData.value = articlesRes
  projectsData.value = projectsRes
})

const articles = computed(() => (articlesData.value?.data || []).slice(0, 2))
const projects = computed(() => (projectsData.value?.data || []).slice(0, 2))
</script>

<template>
  <!-- ── Magazine Cover: Masthead ── -->
  <section class="masthead">
    <div class="masthead-inner">
      <ScrollReveal>
        <span class="masthead-kicker label">Creative Technologist</span>
        <h1 class="masthead-title">
          <span class="masthead-title-line">Your</span>
          <span class="masthead-title-line">Name</span>
        </h1>
        <p class="masthead-desc">Writer and builder. Essays on life, code, and the spaces between.</p>
        <div class="masthead-actions">
          <router-link to="/about" class="masthead-cta label">About</router-link>
          <span class="masthead-stat label">{{ articles.length + projects.length }} pieces</span>
        </div>
      </ScrollReveal>
    </div>
    <div class="masthead-scroll label">Scroll ↓</div>
  </section>

  <!-- ── Feature 01: Writing ── -->
  <ScrollReveal>
    <section class="feature">
      <div class="feature-label">
        <span class="feature-number">01</span>
        <span class="label">Latest Writing</span>
      </div>
      <div class="feature-divider"></div>
      <div class="feature-content">
        <ArticleCard
          v-for="(article, i) in articles"
          :key="article.id"
          :article="article"
          :featured="i === 0"
        />
      </div>
      <router-link to="/articles" class="feature-more label">All writing →</router-link>
    </section>
  </ScrollReveal>

  <!-- ── Feature 02: Projects ── -->
  <ScrollReveal>
    <section class="feature feature-alt">
      <div class="feature-label">
        <span class="feature-number">02</span>
        <span class="label">Selected Projects</span>
      </div>
      <div class="feature-divider"></div>
      <div class="feature-content">
        <div class="feature-projects-grid">
          <ProjectCard
            v-for="(project, i) in projects"
            :key="project.id"
            :project="project"
            :featured="i === 0"
          />
        </div>
      </div>
      <router-link to="/projects" class="feature-more label">All projects →</router-link>
    </section>
  </ScrollReveal>
</template>

<style scoped>
/* ════════════════════════════════════
   Magazine Masthead (Tresmares-inspired)
   ════════════════════════════════════ */
.masthead {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-primary);
  overflow: hidden;
  margin-bottom: var(--space-3xl);
  position: relative;
}

.masthead-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--space-3xl) var(--content-padding);
  color: var(--color-reversed);
  max-width: var(--max-width);
  margin: 0 auto;
  width: 100%;
}

.masthead-kicker {
  display: inline-block;
  margin-bottom: var(--space-xl);
  color: var(--color-reversed-secondary);
  letter-spacing: 0.12em;
  font-size: 0.75rem;
}

.masthead-title {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: var(--space-lg);
}

.masthead-title-line {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(4.5rem, 14vw, 11rem);
  line-height: 0.85;
  letter-spacing: -0.04em;
}

.masthead-desc {
  max-width: var(--measure-wide);
  font-size: clamp(1.125rem, 1.75vw, 1.35rem);
  line-height: 1.6;
  color: var(--color-reversed-secondary);
  margin-bottom: var(--space-xl);
}

.masthead-actions {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.masthead-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-sm) var(--space-lg);
  border: 1px solid var(--color-reversed);
  color: var(--color-reversed);
  transition:
    background var(--duration-fast) var(--ease-out-quart),
    color var(--duration-fast) var(--ease-out-quart);
  font-size: 0.8rem;
}

.masthead-cta:hover {
  background: var(--color-reversed);
  color: var(--color-primary);
}

.masthead-stat {
  color: var(--color-reversed-secondary);
  letter-spacing: 0.08em;
}

/* ── Scroll indicator ── */
.masthead-scroll {
  text-align: center;
  padding-bottom: var(--space-xl);
  color: var(--color-reversed);
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  opacity: 0.6;
  animation: scrollPulse 2.5s ease-in-out infinite;
}

@keyframes scrollPulse {
  0%, 100% { opacity: 0.6; transform: translateY(0); }
  50% { opacity: 0.25; transform: translateY(4px); }
}

/* ════════════════════════════════════
   Magazine Features
   ════════════════════════════════════ */
.feature {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-3xl) var(--content-padding);
  position: relative;
}

.feature-alt {
  background: var(--color-bg-alt);
  max-width: none;
  padding: var(--space-3xl) var(--content-padding);
}

.feature-alt .feature-label,
.feature-alt .feature-divider,
.feature-alt .feature-content,
.feature-alt .feature-more {
  max-width: var(--max-width);
  margin-left: auto;
  margin-right: auto;
}

.feature-label {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.feature-number {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
  color: var(--color-primary);
  letter-spacing: -0.03em;
}

.feature-label .label {
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
}

.feature-divider {
  width: clamp(60px, 10vw, 120px);
  height: 2px;
  background: var(--color-primary);
  margin-bottom: var(--space-xl);
}

.feature-content {
  padding-left: 0;
}

.feature-more {
  display: inline-block;
  margin-top: var(--space-lg);
  color: var(--color-text-secondary);
  transition: color var(--duration-fast) var(--ease-out-quart);
}

.feature-more:hover {
  color: var(--color-primary);
}

.feature-projects-grid {
  display: grid;
  gap: var(--space-md);
}

@media (min-width: 768px) {
  .feature-projects-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .masthead {
    min-height: 90vh;
    margin-bottom: var(--space-2xl);
  }
  .masthead-title-line {
    font-size: clamp(3rem, 14vw, 4.5rem);
  }
}
</style>
