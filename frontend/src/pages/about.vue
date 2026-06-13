<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useApi } from '@/composables/useApi'
import ScrollReveal from '@/components/ScrollReveal.vue'

useHead({ title: 'About' })

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

const articles = computed(() => articlesData.value?.data || [])
const projects = computed(() => projectsData.value?.data || [])
</script>

<template>
  <section class="contributors-page">
    <div class="contributors-sidebar">
      <ScrollReveal>
        <div class="contributor-figure">
          <div class="contributor-initials">
            <span class="display">Y</span>
          </div>
        </div>
        <div class="contributor-stats">
          <div class="cstat">
            <span class="cstat-num">{{ articles.length }}</span>
            <span class="cstat-label label">Essays</span>
          </div>
          <div class="cstat">
            <span class="cstat-num">{{ projects.length }}</span>
            <span class="cstat-label label">Projects</span>
          </div>
        </div>
        <div class="contributor-divider"></div>
        <div class="contributor-contact">
          <span class="label">Find online</span>
          <a href="https://github.com" target="_blank" class="contributor-link">GitHub</a>
          <a href="mailto:hello@example.com" class="contributor-link">hello@example.com</a>
        </div>
      </ScrollReveal>
    </div>

    <div class="contributors-main">
      <ScrollReveal>
        <span class="contributors-eyebrow label">Contributor</span>
        <h1 class="display contributors-name">Your Name</h1>
        <div class="contributors-bio mag-prose prose">
          <p>
            I write about life, design, and the spaces between. Sometimes I build things too.
          </p>
          <p>
            This site is a quiet corner of the internet — a place for essays that don't fit on social media,
            projects that don't need a product page, and thoughts that benefit from a slower pace.
          </p>
          <p>
            By day I work on design systems and frontend architecture. By night I read,
            write, and take long walks without a destination.
          </p>
          <p>
            If something here resonates, <a href="mailto:hello@example.com">drop me a note</a>.
          </p>
        </div>
        <a href="mailto:hello@example.com" class="contributors-cta label">
          Send a letter →
        </a>
      </ScrollReveal>
    </div>
  </section>
</template>

<style scoped>
.contributors-page {
  display: grid;
  grid-template-columns: 1fr;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-3xl) var(--content-padding);
  gap: var(--space-2xl);
  min-height: 70vh;
}

.contributors-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.contributor-figure {
  max-width: 160px;
}

.contributor-initials {
  width: 120px;
  height: 120px;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.contributor-initials .display {
  color: var(--color-reversed);
  font-size: 4rem;
  line-height: 1;
}

.contributor-stats {
  display: flex;
  gap: var(--space-2xl);
}

.cstat {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
}

.cstat-num {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 2.5rem;
  line-height: 1;
  color: var(--color-text);
  letter-spacing: -0.03em;
}

.cstat-label {
  color: var(--color-text-secondary);
}

.contributor-divider {
  width: 100%;
  height: 1px;
  background: var(--color-border);
}

.contributor-contact {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.contributor-contact .label {
  margin-bottom: var(--space-3xs);
  color: var(--color-text-secondary);
}

.contributor-link {
  color: var(--color-text-secondary);
  transition: color var(--duration-fast) var(--ease-out-quart);
  width: fit-content;
  font-size: 0.875rem;
}

.contributor-link:hover {
  color: var(--color-primary);
}

.contributors-main {
  max-width: var(--measure-body);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.contributors-eyebrow {
  display: inline-block;
  margin-bottom: var(--space-sm);
  color: var(--color-primary);
  letter-spacing: 0.1em;
}

.contributors-name {
  margin-bottom: var(--space-md);
  text-wrap: balance;
  letter-spacing: -0.02em;
}

.contributors-bio p {
  margin-bottom: var(--space-md);
  line-height: 1.8;
}

.contributors-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  margin-top: var(--space-xl);
  padding: var(--space-xs) var(--space-md);
  background: var(--color-text);
  color: var(--color-bg);
  transition:
    background var(--duration-fast) var(--ease-out-quart);
  width: fit-content;
  letter-spacing: 0.05em;
}

.contributors-cta:hover {
  background: var(--color-primary);
}

@media (min-width: 768px) {
  .contributors-page {
    grid-template-columns: 260px 1fr;
  }
}
</style>
