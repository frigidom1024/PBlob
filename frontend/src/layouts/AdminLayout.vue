<script setup lang="ts">
import { useHead } from '@unhead/vue'
import AdminSidebar from '@/components/AdminSidebar.vue'

useHead({ titleTemplate: (title?: string) => title ? `${title} — Admin` : 'Admin — Personal Blob' })
</script>

<template>
  <div class="admin-shell">
    <AdminSidebar />
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<style>
@import url('@/assets/css/tokens.css');
@import url('@/assets/css/reset.css');
@import url('@/assets/css/typography.css');

.admin-shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.admin-main {
  flex: 1;
  margin-left: 240px;
  padding: var(--space-xl);
  max-width: calc(100vw - 240px);
}
</style>
