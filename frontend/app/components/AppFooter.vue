<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-left">
        <span class="label footer-label">Personal Blob</span>
        <span class="caption">writing · building · thinking</span>
      </div>
      <div class="footer-right caption">
        &copy; {{ year }} Your Name
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--color-border);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-lg) var(--content-padding);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.footer-label {
  font-size: 0.75rem;
}
</style>
