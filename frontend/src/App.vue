<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
// Initialize theme on app boot
useTheme()
</script>

<template>
  <router-view />
</template>
