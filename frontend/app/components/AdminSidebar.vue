<script setup lang="ts">
const token = ref('')
const user = ref<any>(null)
const { getLoginUrl, getMe } = useApi()

const config = useRuntimeConfig()
const isDev = config.public.appEnv !== 'production'

onMounted(async () => {
  const route = useRoute()
  if (route.query.token) {
    localStorage.setItem('admin_token', route.query.token as string)
    await navigateTo('/admin')
  }

  // 非 production 环境直接设置 mock 用户
  if (isDev) {
    user.value = { id: 0, github_login: 'dev-user', avatar_url: '' }
    return
  }

  token.value = localStorage.getItem('admin_token') || ''
  if (token.value) {
    try {
      const res = await getMe()
      user.value = res.data
    } catch {
      localStorage.removeItem('admin_token')
    }
  }
})

function logout() {
  localStorage.removeItem('admin_token')
  user.value = null
  navigateTo('/admin/login')
}

const nav = [
  { label: '仪表盘', icon: '⊞', to: '/admin' },
  { label: '文章', icon: '✎', to: '/admin/articles' },
  { label: '项目', icon: '◧', to: '/admin/projects' },
  { label: '写作台', icon: '✎', to: '/admin/workbench' },
]
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <NuxtLink to="/admin" class="sidebar-logo label">Personal Blob</NuxtLink>
      <span class="sidebar-badge label">Admin</span>
    </div>

    <nav class="sidebar-nav">
      <NuxtLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="sidebar-link label"
        :class="{ 'sidebar-link--active': $route.path === item.to || $route.path.startsWith(item.to + '/') }"
      >
        <span class="sidebar-icon">{{ item.icon }}</span>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="sidebar-footer">
      <div v-if="user" class="sidebar-user">
        <img :src="user.avatar_url" class="sidebar-avatar" />
        <span class="sidebar-username caption">{{ user.github_login }}</span>
      </div>
      <button v-if="user" @click="logout" class="sidebar-logout label">退出</button>
      <a v-else :href="getLoginUrl()" class="sidebar-login label">Login</a>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;
  background: var(--color-bg-alt);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.sidebar-logo {
  font-weight: 600;
  letter-spacing: 0.05em;
}

.sidebar-badge {
  font-size: 0.6rem;
  padding: 0.25em 0.5em;
  background: var(--color-primary);
  color: var(--color-reversed);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: 4px;
  color: var(--color-text-secondary);
  transition: all var(--duration-fast) var(--ease-out-quart);
  text-decoration: none;
}

.sidebar-link:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.sidebar-link--active {
  background: var(--color-primary);
  color: var(--color-reversed);
}

.sidebar-icon {
  width: 20px;
  text-align: center;
  font-size: 1rem;
}

.sidebar-footer {
  padding: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.sidebar-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.sidebar-username {
  color: var(--color-text-secondary);
}

.sidebar-logout,
.sidebar-login {
  display: block;
  width: 100%;
  text-align: center;
  padding: var(--space-2xs);
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: none;
  transition: all var(--duration-fast) var(--ease-out-quart);
  text-decoration: none;
}

.sidebar-logout:hover,
.sidebar-login:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
