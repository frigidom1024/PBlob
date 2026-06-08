<script setup lang="ts">
definePageMeta({ layout: false })

const { getLoginUrl } = useApi()
const route = useRoute()

const config = useRuntimeConfig()
// 非 production 环境自动跳转到后台
if (config.public.appEnv !== 'production') {
  navigateTo('/admin')
}

const error = computed(() => {
  const e = route.query.error
  if (e === 'not_authorized') return '此 GitHub 账号未在管理员白名单中'
  if (e === 'token_failed') return 'GitHub 认证失败，请重试'
  if (e === 'server_error') return '服务器错误，请稍后重试'
  return ''
})
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-block"></div>
      <h1 class="display login-title">Admin</h1>
      <p class="login-desc">使用 GitHub 账号登录管理后台</p>

      <p v-if="error" class="login-error">{{ error }}</p>

      <a :href="getLoginUrl()" class="login-btn label">
        Login with GitHub
      </a>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-2xl);
  border: 1px solid var(--color-border);
  max-width: 380px;
  width: 100%;
}

.login-block {
  width: 60px;
  height: 60px;
  background: var(--color-primary);
}

.login-title {
  font-size: 2.5rem;
  letter-spacing: -0.03em;
}

.login-desc {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.login-error {
  color: oklch(55% 0.2 30);
  font-size: 0.85rem;
  text-align: center;
  padding: var(--space-xs) var(--space-sm);
  background: oklch(90% 0.1 30 / 0.2);
  width: 100%;
}

.login-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-text);
  color: var(--color-bg);
  transition: background var(--duration-fast) var(--ease-out-quart);
  width: 100%;
  justify-content: center;
  text-decoration: none;
}

.login-btn:hover {
  background: var(--color-primary);
}
</style>
