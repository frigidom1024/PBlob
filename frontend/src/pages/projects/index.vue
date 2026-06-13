<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useApi } from '@/composables/useApi'
import ProjectCard from '@/components/ProjectCard.vue'

useHead({ title: 'Projects' })

const api = useApi()
const data = ref<any>(null)

onMounted(async () => {
  const result = await api.getProjects({ published: 1 })
  data.value = result
})

const projects = computed(() => data.value?.data || [])
</script>

<template>
  <!-- ── Magazine feature spread header ── -->
  <section class="folio-header">
    <div class="folio-header-inner">
      <span class="folio-section-marker label">Portfolio</span>
      <div class="folio-title-row">
        <h1 class="folio-title">Projects</h1>
        <span class="folio-count">{{ projects.length }}</span>
      </div>
      <p class="folio-desc">Selected works, gathered in one place.</p>
    </div>
    <div class="folio-header-bar">
      <div class="folio-bar-block"></div>
      <div class="folio-bar-line"></div>
    </div>
  </section>

  <!-- ── Magazine project grid ── -->
  <section class="folio-grid">
    <div class="folio-grid-inner">
      <ProjectCard
        v-for="(project, i) in projects"
        :key="project.id"
        :project="project"
        :featured="i === 0"
      />
    </div>
  </section>
</template>

<style scoped>
/* ════════════════════════════════════
   Magazine Folio Header
   ════════════════════════════════════ */
.folio-header {
  overflow: hidden;
}

.folio-header-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-3xl) var(--content-padding) var(--space-xl);
}

.folio-section-marker {
  display: inline-block;
  margin-bottom: var(--space-md);
  color: var(--color-primary);
  letter-spacing: 0.12em;
}

.folio-title-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.folio-title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(4rem, 10vw, 6rem);
  line-height: 0.9;
  letter-spacing: -0.03em;
}

.folio-count {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  line-height: 1;
  color: var(--color-primary);
  opacity: 0.4;
}

.folio-desc {
  max-width: var(--measure-narrow);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.folio-header-bar {
  display: grid;
  grid-template-columns: 1fr 3fr;
  align-items: stretch;
}

.folio-bar-block {
  background: var(--color-primary);
  height: 8px;
}

.folio-bar-line {
  background: var(--color-bg-alt);
  border-bottom: 1px solid var(--color-border);
}

/* ════════════════════════════════════
   Project Grid
   ════════════════════════════════════ */
.folio-grid {
  background: var(--color-bg-alt);
  border-bottom: 1px solid var(--color-border);
}

.folio-grid-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-2xl) var(--content-padding) var(--space-3xl);
  display: grid;
  gap: var(--space-md);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .folio-grid-inner {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
