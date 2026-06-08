<script setup lang="ts">
const props = defineProps<{
  project: { id: number; title: string; date: string; created_at: string; excerpt: string; tags?: string[]; cover_image?: string; image?: string; url?: string }
  featured?: boolean
}>()
</script>

<template>
  <article :class="['project-card', { 'project-card--featured': featured }]">
    <div v-if="project.cover_image || project.image" class="project-image">
      <img :src="project.cover_image || project.image" :alt="project.title" loading="lazy" />
    </div>
    <div class="project-body">
      <div class="project-meta label">
        <time :datetime="project.date">{{ new Date(project.date).getFullYear() }}</time>
      </div>
      <h2 :class="featured ? 'headline' : 'title'">{{ project.title }}</h2>
      <p class="project-excerpt caption">{{ project.excerpt }}</p>
      <div v-if="project.tags?.length" class="project-tags">
        <span v-for="tag in project.tags" :key="tag" class="project-tag label">
          {{ tag }}
        </span>
      </div>
      <a
        v-if="project.url"
        :href="project.url"
        class="project-link label"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Project ↗
      </a>
    </div>
  </article>
</template>

<style scoped>
.project-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  transition:
    border-color var(--duration-normal) var(--ease-out-quart),
    transform var(--duration-normal) var(--ease-out-quart);
}

.project-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.project-card--featured {
  border-color: var(--color-primary);
  border-width: 2px;
  background: var(--color-bg);
}

.project-image {
  overflow: hidden;
}

.project-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-out-quart);
}

.project-card:hover .project-image img {
  transform: scale(1.03);
}

.project-card--featured .project-image {
  order: -1;
}

.project-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.project-meta {
  color: var(--color-text-secondary);
}

.project-title {
  transition: color var(--duration-fast) var(--ease-out-quart);
}

.project-card:hover .project-title {
  color: var(--color-primary);
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
}

.project-tag {
  font-size: 0.625rem;
  padding: 0.25em 0.6em;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.project-link {
  display: inline-block;
  margin-top: var(--space-xs);
  color: var(--color-primary);
  font-size: 0.75rem;
  transition: opacity var(--duration-fast) var(--ease-out-quart);
}

.project-link:hover {
  opacity: 0.7;
}

@media (min-width: 640px) {
  .project-card {
    grid-template-columns: 280px 1fr;
  }
  .project-image img {
    height: 100%;
  }

  .project-card--featured {
    grid-template-columns: 360px 1fr;
    grid-column: 1 / -1;
  }

  .project-card--featured .project-meta,
  .project-card--featured .project-title {
    grid-column: auto;
  }
}
</style>
