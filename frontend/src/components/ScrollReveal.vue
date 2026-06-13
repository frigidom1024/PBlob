<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  stagger?: boolean
  delay?: number
}>(), {
  stagger: false,
  delay: 0,
})

const el = ref<HTMLElement | null>(null)
const staggerDelay = props.stagger ? 120 : 0

onMounted(() => {
  if (!el.value || !('IntersectionObserver' in window)) return
  const children = Array.from(el.value.children)
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const child = entry.target as HTMLElement
          const index = children.indexOf(child)
          const delay = index * staggerDelay + props.delay
          child.style.transitionDelay = `${delay}ms`
          child.style.opacity = '1'
          child.style.transform = 'translateY(0)'
          observer.unobserve(child)
        }
      }
    },
    { threshold: 0.1 },
  )
  for (const child of children) {
    ;(child as HTMLElement).style.opacity = '0'
    ;(child as HTMLElement).style.transform = 'translateY(24px)'
    ;(child as HTMLElement).style.transition =
      'opacity 600ms var(--ease-out-expo), transform 600ms var(--ease-out-expo)'
    observer.observe(child)
  }
})
</script>

<template>
  <div ref="el">
    <slot />
  </div>
</template>
