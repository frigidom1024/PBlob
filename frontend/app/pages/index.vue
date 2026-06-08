<script setup lang="ts">
const api = useApi()

const { data: articlesData } = await useAsyncData('home-articles', () =>
  api.getArticles({ published: 1 })
)
const { data: projectsData } = await useAsyncData('home-projects', () =>
  api.getProjects({ published: 1 })
)

const articles = computed(() => (articlesData.value?.data || []).slice(0, 2))
const projects = computed(() => (projectsData.value?.data || []).slice(0, 2))
</script>

<template>
  <!-- ── Magazine Cover: Masthead ── -->
  <section class="masthead">
    <div class="masthead-inner">
      <ScrollReveal>
        <span class="masthead-kicker label">Creative Technologist</span>
        <div class="masthead-title-block">
          <h1 class="masthead-name">Your<br />Name</h1>
          <div class="masthead-accent"></div>
        </div>
        <p class="masthead-desc">Writer and builder. Essays on life, code, and the spaces between.</p>
        <div class="masthead-actions">
          <NuxtLink to="/about" class="masthead-cta label">About</NuxtLink>
          <span class="masthead-stat label">{{ articles.length + projects.length }} pieces</span>
        </div>
      </ScrollReveal>
    </div>
    <div class="masthead-geo">
      <div class="mg-block mg-block--large"></div>
      <div class="mg-block mg-block--small"></div>
      <div class="mg-line"></div>
      <div class="mg-circle"></div>
    </div>
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
      <NuxtLink to="/articles" class="feature-more label">All writing →</NuxtLink>
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
      <NuxtLink to="/projects" class="feature-more label">All projects →</NuxtLink>
    </section>
  </ScrollReveal>
</template>

<style scoped>
/* ════════════════════════════════════
   Magazine Masthead (Cover)
   ════════════════════════════════════ */
.masthead {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 85vh;
  background: var(--color-primary);
  overflow: hidden;
  margin-bottom: var(--space-3xl);
}

.masthead-inner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--space-3xl) var(--content-padding);
  color: var(--color-reversed);
  z-index: 1;
}

.masthead-kicker {
  display: inline-block;
  margin-bottom: var(--space-lg);
  color: var(--color-reversed-secondary);
  letter-spacing: 0.12em;
}

.masthead-title-block {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.masthead-name {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(4.5rem, 12vw, 9rem);
  line-height: 0.85;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.masthead-accent {
  width: 12px;
  height: 80px;
  background: var(--color-reversed);
  opacity: 0.25;
  flex-shrink: 0;
  margin-top: 0.3em;
}

.masthead-desc {
  max-width: var(--measure-narrow);
  font-size: clamp(1rem, 1.5vw, 1.125rem);
  line-height: 1.7;
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
  padding: var(--space-xs) var(--space-md);
  border: 1px solid var(--color-reversed);
  color: var(--color-reversed);
  transition:
    background var(--duration-fast) var(--ease-out-quart),
    color var(--duration-fast) var(--ease-out-quart);
}

.masthead-cta:hover {
  background: var(--color-reversed);
  color: var(--color-primary);
}

.masthead-stat {
  color: var(--color-reversed-secondary);
  letter-spacing: 0.08em;
}

/* ── Masthead geometric elements ── */
.masthead-geo {
  position: relative;
  overflow: hidden;
}

.mg-block--large {
  position: absolute;
  top: 20%;
  left: -10%;
  width: 70%;
  height: 60%;
  background: var(--color-primary-deep);
}

.mg-block--small {
  position: absolute;
  bottom: 10%;
  right: 15%;
  width: 40%;
  height: 25%;
  background: var(--color-primary-deep);
  opacity: 0.6;
}

.mg-line {
  position: absolute;
  top: 15%;
  right: 5%;
  width: 55%;
  height: 2px;
  background: var(--color-reversed);
  opacity: 0.12;
}

.mg-circle {
  position: absolute;
  bottom: 35%;
  right: 25%;
  width: 180px;
  height: 180px;
  border: 3px solid var(--color-reversed-secondary);
  border-radius: 50%;
  opacity: 0.2;
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
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .masthead-geo {
    display: none;
  }
  .masthead {
    margin-bottom: var(--space-2xl);
  }
}
</style>
