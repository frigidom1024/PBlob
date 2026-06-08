<script setup lang="ts">
const nav = [
  { label: 'Home', href: '/' },
  { label: 'Writing', href: '/articles' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
]
</script>

<template>
  <header class="site-header">
    <nav class="header-inner">
      <NuxtLink to="/" class="logo label">Personal Blob</NuxtLink>
      <ul class="nav-list">
        <li v-for="item in nav" :key="item.href">
          <NuxtLink :to="item.href" class="nav-link label">
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-sm) var(--content-padding);
}

.logo {
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  font-weight: 600;
  transition: color var(--duration-fast) var(--ease-out-quart);
}

.logo:hover {
  color: var(--color-primary);
}

.nav-list {
  display: flex;
  gap: var(--space-lg);
}

.nav-link {
  position: relative;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  transition: color var(--duration-fast) var(--ease-out-quart);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--color-primary);
  transition: width var(--duration-normal) var(--ease-out-quart);
}

.nav-link:hover {
  color: var(--color-text);
}

.nav-link:hover::after {
  width: 100%;
}
</style>
