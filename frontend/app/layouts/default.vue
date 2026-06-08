<script setup lang="ts">
useHead({
  titleTemplate: (title) => title ? `${title} — Personal Blob` : 'Personal Blob',
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&display=swap' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap' },
  ],
})
</script>

<template>
  <AppHeader />
  <main>
    <slot />
  </main>
  <AppFooter />
</template>

<style>
@import url('~/assets/css/tokens.css');
@import url('~/assets/css/reset.css');
@import url('~/assets/css/typography.css');
@import url('~/assets/css/prose.css');
</style>
