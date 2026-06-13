<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { isDark, toggle } = useTheme()

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
      <router-link to="/" class="logo label">Personal Blob</router-link>
      <div class="header-right">
        <ul class="nav-list">
          <li v-for="item in nav" :key="item.href">
            <router-link :to="item.href" class="nav-link label">
              {{ item.label }}
            </router-link>
          </li>
        </ul>
        <button
          class="theme-toggle label"
          :title="isDark ? '切换到亮色模式' : '切换到深色模式'"
          @click="toggle"
          aria-label="切换主题"
        >
          <span v-if="isDark" class="theme-icon">☀</span>
          <span v-else class="theme-icon">☾</span>
        </button>
      </div>
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
.logo:hover { color: var(--color-primary); }
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}
.nav-list { display: flex; gap: var(--space-lg); }
.theme-toggle {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out-quart);
  padding: 0;
  font-size: 0.85rem;
  line-height: 1;
}
.theme-toggle:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.theme-icon {
  display: inline-block;
  line-height: 1;
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
.nav-link:hover { color: var(--color-text); }
.nav-link:hover::after { width: 100%; }
</style>
