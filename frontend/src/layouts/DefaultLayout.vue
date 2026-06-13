<script setup lang="ts">
import { useHead } from '@unhead/vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

useHead({
  titleTemplate: (title?: string) => title ? `${title} — Personal Blob` : 'Personal Blob',
})
</script>

<template>
  <AppHeader />
  <main>
    <router-view />
  </main>
  <AppFooter />
</template>

<style>
@import url('@/assets/css/tokens.css');
@import url('@/assets/css/reset.css');
@import url('@/assets/css/typography.css');
@import url('@/assets/css/prose.css');
</style>
