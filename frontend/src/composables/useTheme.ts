import { ref, watch } from 'vue'

const STORAGE_KEY = 'theme'

function getSystemPreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getStoredPreference(): boolean | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return null
}

function applyTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Resolve initial theme before Vue mounts (sync with inline script in index.html)
const initialDark = getStoredPreference() ?? getSystemPreference()
applyTheme(initialDark)

export function useTheme() {
  const isDark = ref(initialDark)

  // Listen for system preference changes (only when no user override)
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', (e) => {
    if (localStorage.getItem(STORAGE_KEY) === null) {
      isDark.value = e.matches
    }
  })

  watch(isDark, (val) => {
    applyTheme(val)
    localStorage.setItem(STORAGE_KEY, val ? 'dark' : 'light')
  })

  function toggle() {
    isDark.value = !isDark.value
  }

  // Allow system preference to override when user hasn't explicitly chosen
  function resetToSystem() {
    localStorage.removeItem(STORAGE_KEY)
    isDark.value = getSystemPreference()
  }

  return { isDark, toggle, resetToSystem }
}
