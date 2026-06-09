<script setup lang="ts">
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

definePageMeta({ layout: false })

const api = useApi()

const CATEGORIES = ['技术', '阅读', '故事', '随笔'] as const

// ── State ──
const articles = ref<any[]>([])
const currentId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)
const saveStatus = ref<'saved' | 'unsaved' | 'saving'>('saved')
const autoSaveEnabled = ref(true)
const searchQuery = ref('')
const selectedCategory = ref<string>('')
const filterStatus = ref<'all' | 'published' | 'draft'>('all')
const showSidebar = ref(true)
const showMeta = ref(false)
const showSettings = ref(false)
const draftsExpanded = ref(true)
const archivedExpanded = ref(false)
const activeActivity = ref<'explorer' | 'search'>('explorer')

// Form state
const formTitle = ref('')
const formSlug = ref('')
const formContent = ref('')
const formExcerpt = ref('')
const formCategory = ref('随笔')
const formTags = ref('')
const formCoverImage = ref('')
const formPublished = ref(false)
const textareaEl = ref<HTMLTextAreaElement | null>(null)

// ── Computed ──
const filteredArticles = computed(() => {
  let list = articles.value
  if (selectedCategory.value) list = list.filter((a: any) => a.category === selectedCategory.value)
  if (filterStatus.value === 'published') list = list.filter((a: any) => a.published)
  else if (filterStatus.value === 'draft') list = list.filter((a: any) => !a.published)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((a: any) => a.title.toLowerCase().includes(q))
  }
  return list
})

const draftsByCategory = computed(() => {
  const map: Record<string, any[]> = {}
  for (const a of articles.value) {
    if (a.published) continue
    const cat = a.category || '随笔'
    if (!map[cat]) map[cat] = []
    map[cat].push(a)
  }
  return map
})

const publishedByCategory = computed(() => {
  const map: Record<string, any[]> = {}
  for (const a of articles.value) {
    if (!a.published) continue
    const cat = a.category || '随笔'
    if (!map[cat]) map[cat] = []
    map[cat].push(a)
  }
  return map
})

const isEditing = computed(() => currentId.value !== null)
const isNewArticle = ref(false)

const lineCount = computed(() => {
  if (!formContent.value) return 1
  return formContent.value.split('\n').length
})

const charCount = computed(() => formContent.value.length)

const lineNumbers = computed(() => {
  const count = Math.max(lineCount.value, 1)
  return Array.from({ length: count }, (_, i) => i + 1)
})

// ── Lifecycle ──
onMounted(async () => {
  await fetchArticles()
})

// ── API ──
async function fetchArticles() {
  loading.value = true
  try {
    const res = await api.getArticles()
    articles.value = res.data || []
    if (articles.value.length > 0 && !currentId.value && !isNewArticle.value) {
      selectArticle(articles.value[0].id)
    }
  } catch { /* ignore */ }
  finally { loading.value = false }
}

async function selectArticle(id: number) {
  if (currentId.value === id && !isNewArticle.value) return
  saveCurrentBeforeSwitch()
  isNewArticle.value = false
  currentId.value = id
  const article = articles.value.find((a: any) => a.id === id)
  if (article) {
    try {
      const res = await api.getArticle(article.slug)
      const a = res.data
      formTitle.value = a.title || ''
      formSlug.value = a.slug || ''
      formExcerpt.value = a.excerpt || ''
      formContent.value = a.content || ''
      formCategory.value = a.category || '随笔'
      formTags.value = (a.tags || []).join(', ')
      formCoverImage.value = a.cover_image || ''
      formPublished.value = !!a.published
      saveStatus.value = 'saved'
      nextTick(() => syncScroll())
    } catch { /* ignore */ }
  }
}

async function createNewArticle() {
  saveCurrentBeforeSwitch()
  isNewArticle.value = true
  currentId.value = null
  formTitle.value = ''
  formSlug.value = ''
  formExcerpt.value = ''
  formContent.value = ''
  formCategory.value = '随笔'
  formTags.value = ''
  formCoverImage.value = ''
  formPublished.value = false
  saveStatus.value = 'unsaved'
  showSidebar.value = true
}

async function saveCurrentArticle(publish?: boolean) {
  if (!formTitle.value && !formContent.value) return
  saving.value = true
  saveStatus.value = 'saving'
  const tags = formTags.value ? formTags.value.split(',').map((t: string) => t.trim()).filter(Boolean) : []

  try {
    if (isNewArticle.value) {
      const res = await api.createArticle({
        title: formTitle.value || '未命名文章',
        slug: formSlug.value || undefined,
        excerpt: formExcerpt.value,
        content: formContent.value,
        category: formCategory.value,
        tags,
        cover_image: formCoverImage.value || null,
        published: publish ?? formPublished.value,
      })
      isNewArticle.value = false
      currentId.value = res.data.id
      await fetchArticles()
    } else if (currentId.value) {
      const article = articles.value.find((a: any) => a.id === currentId.value)
      await api.updateArticle(currentId.value, {
        title: formTitle.value || '未命名文章',
        slug: formSlug.value || article?.slug,
        excerpt: formExcerpt.value,
        content: formContent.value,
        category: formCategory.value,
        tags,
        cover_image: formCoverImage.value || null,
        published: publish ?? formPublished.value,
      })
      await fetchArticles()
    }
    formPublished.value = publish ?? formPublished.value
    saveStatus.value = 'saved'
  } catch {
    saveStatus.value = 'unsaved'
  } finally {
    saving.value = false
  }
}

async function deleteArticle(id: number) {
  if (!confirm('删除后不可恢复，确定？')) return
  try {
    await api.deleteArticle(id)
    if (currentId.value === id) {
      currentId.value = null
      isNewArticle.value = false
      formTitle.value = ''
      formContent.value = ''
    }
    await fetchArticles()
  } catch { /* ignore */ }
}

function saveCurrentBeforeSwitch() {
  if (saveStatus.value === 'unsaved' && (formTitle.value || formContent.value)) {
    saveCurrentArticle()
  }
}

// ── Editor ──
function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  formContent.value = target.value
  saveStatus.value = 'unsaved'
  debouncedAutoSave()
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    saveCurrentArticle()
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
    e.preventDefault()
    showSidebar.value = !showSidebar.value
  }
}

// Scroll sync for line numbers
const gutterEl = ref<HTMLElement | null>(null)
function syncScroll() {
  if (textareaEl.value && gutterEl.value) {
    gutterEl.value.scrollTop = textareaEl.value.scrollTop
  }
}

const debouncedAutoSave = debounce(() => {
  if (autoSaveEnabled.value && (currentId.value || isNewArticle.value)) saveCurrentArticle()
}, 3000)

// ── Upload ──
async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !textareaEl.value) return
  try {
    const res = await api.uploadImage(file)
    const url = res.data.url
    const start = textareaEl.value.selectionStart
    const end = textareaEl.value.selectionEnd
    const before = formContent.value.slice(0, start)
    const after = formContent.value.slice(end)
    formContent.value = `${before}![img](${url})\n${after}`
    saveStatus.value = 'unsaved'
    nextTick(() => {
      textareaEl.value!.selectionStart = textareaEl.value!.selectionEnd = start + url.length + 9
      textareaEl.value!.focus()
    })
  } catch { /* ignore */ }
  input.value = ''
}

// ── Focus title on new article ──
const titleInput = ref<HTMLInputElement | null>(null)
watch(isNewArticle, (v) => {
  if (v) nextTick(() => titleInput.value?.focus())
})
</script>

<template>
  <div class="workbench">
    <!-- ── Activity Bar ── -->
    <div class="activity-bar">
      <div class="activity-top">
        <NuxtLink to="/admin" class="activity-icon" title="返回后台">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="16" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" stroke-width="1.5"/>
            <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </NuxtLink>
        <button
          :class="['activity-icon', { active: activeActivity === 'explorer' }]"
          @click="activeActivity = 'explorer'; showSidebar = true"
          title="文章列表 (Ctrl+B)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="3" width="16" height="14" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <line x1="2" y1="7" x2="18" y2="7" stroke="currentColor" stroke-width="1.5"/>
            <line x1="6" y1="3" x2="6" y2="17" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
        <button
          :class="['activity-icon', { active: activeActivity === 'search' }]"
          @click="activeActivity = 'search'; showSidebar = true"
          title="搜索"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <line x1="12" y1="12" x2="16" y2="16" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      </div>
      <div class="activity-bottom">
        <button
          :class="['activity-icon', { active: showMeta }]"
          @click="showMeta = !showMeta"
          title="文章属性"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="5" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <circle cx="10" cy="15" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
        </button>
        <button
          :class="['activity-icon', { active: showSettings }]"
          @click="showSettings = !showSettings"
          title="设置"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M10 3.5v3M10 13.5v3M3.5 10h3M13.5 10h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Side Bar ── -->
    <aside v-if="showSidebar" class="side-bar">
      <div class="side-bar-header">
        <span class="side-bar-title caption">
          {{ activeActivity === 'explorer' ? '文章' : '搜索' }}
        </span>
        <button class="side-bar-btn" @click="showSidebar = false" title="关闭侧栏">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" stroke-width="1.5"/>
            <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      </div>

      <template v-if="activeActivity === 'explorer'">
        <div class="side-bar-toolbar">
          <div class="side-bar-search">
            <input v-model="searchQuery" class="side-bar-input caption" placeholder="搜索文章..." />
          </div>
          <button class="side-bar-new-btn" @click="createNewArticle" title="新建文章">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" stroke-width="1.5"/>
              <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>

        <!-- Category pills -->
        <div class="cat-pills">
          <button :class="['cat-pill', { active: !selectedCategory }]" @click="selectedCategory = ''">全部</button>
          <button v-for="cat in CATEGORIES" :key="cat" :class="['cat-pill', { active: selectedCategory === cat }]" @click="selectedCategory = cat">{{ cat }}</button>
        </div>

        <!-- Searching or category filter: flat results -->
        <template v-if="searchQuery.trim() || selectedCategory">
          <div class="side-bar-items">
            <div v-if="loading" class="side-bar-loading"><div v-for="i in 3" :key="i" class="skeleton-line"></div></div>
            <div v-for="article in filteredArticles" :key="article.id" :class="['side-bar-item', { active: article.id === currentId }]" @click="selectArticle(article.id)">
              <span class="file-icon">{{ article.published ? '◧' : '◌' }}</span>
              <div class="file-info">
                <span class="file-name">{{ article.title || '未命名' }}</span>
                <span class="file-meta caption">{{ article.published ? '已发布' : '草稿' }} · {{ new Date(article.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }}</span>
              </div>
              <button v-if="!article.published" class="file-delete" @click.stop="deleteArticle(article.id)" title="删除">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>
            </div>
            <div v-if="!loading && filteredArticles.length === 0" class="side-bar-empty caption">没有匹配的文章</div>
          </div>
        </template>

        <!-- Default: grouped by category -->
        <template v-else>
          <div class="side-bar-items">
            <div v-if="loading" class="side-bar-loading"><div v-for="i in 3" :key="i" class="skeleton-line"></div></div>

            <template v-for="cat in CATEGORIES" :key="cat">
              <div v-if="draftsByCategory[cat]?.length" class="section-group">
                <button class="section-header" @click="draftsExpanded = !draftsExpanded">
                  <svg :class="['section-arrow', { open: draftsExpanded }]" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <span class="section-label">{{ cat }}</span>
                  <span class="section-count caption">{{ draftsByCategory[cat].length }}</span>
                </button>
                <div v-if="draftsExpanded" class="section-items">
                  <div v-for="article in draftsByCategory[cat]" :key="article.id" :class="['side-bar-item', { active: article.id === currentId }]" @click="selectArticle(article.id)">
                    <span class="file-icon">◌</span>
                    <div class="file-info">
                      <span class="file-name">{{ article.title || '未命名' }}</span>
                      <span class="file-meta caption">{{ new Date(article.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }}</span>
                    </div>
                    <button class="file-delete" @click.stop="deleteArticle(article.id)" title="删除">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <template v-for="cat in CATEGORIES" :key="'arch-'+cat">
              <div v-if="publishedByCategory[cat]?.length" class="section-group">
                <button class="section-header" @click="archivedExpanded = !archivedExpanded">
                  <svg :class="['section-arrow', { open: archivedExpanded }]" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <span class="section-label">{{ cat }} · 归档</span>
                  <span class="section-count caption">{{ publishedByCategory[cat].length }}</span>
                </button>
                <div v-if="archivedExpanded" class="section-items">
                  <div v-for="article in publishedByCategory[cat]" :key="article.id" :class="['side-bar-item', { active: article.id === currentId }]" @click="selectArticle(article.id)">
                    <span class="file-icon">◧</span>
                    <div class="file-info">
                      <span class="file-name">{{ article.title || '未命名' }}</span>
                      <span class="file-meta caption">{{ new Date(article.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <div v-if="articles.length === 0" class="side-bar-empty caption">暂无文章</div>
          </div>
        </template>
      </template>

      <template v-if="activeActivity === 'search'">
        <div class="side-bar-toolbar">
          <div class="side-bar-search">
            <input v-model="searchQuery" class="side-bar-input caption" placeholder="搜索文章..." autofocus />
          </div>
        </div>
        <div class="side-bar-items">
          <div v-for="article in filteredArticles" :key="article.id" :class="['side-bar-item', { active: article.id === currentId }]" @click="selectArticle(article.id)">
            <span class="file-icon">{{ article.published ? '◧' : '◌' }}</span>
            <div class="file-info">
              <span class="file-name">{{ article.title || '未命名' }}</span>
              <span class="file-meta caption">{{ article.published ? '已发布' : '草稿' }}</span>
            </div>
          </div>
          <div v-if="!loading && filteredArticles.length === 0" class="side-bar-empty caption">没有匹配的文章</div>
        </div>
      </template>
    </aside>

    <!-- ── Editor Panel ── -->
    <main class="editor-panel">
      <!-- Welcome -->
      <div v-if="!isEditing && !isNewArticle" class="editor-welcome">
        <div class="welcome-block"></div>
        <h2 class="title">写作工作台</h2>
        <p class="caption welcome-desc">从左侧选择一篇文章或创建新文件</p>
        <button class="welcome-btn label" @click="createNewArticle">新建文章</button>
      </div>

      <!-- Active editor -->
      <div v-else class="editor-active">
        <!-- Tab bar -->
        <div class="tab-bar">
          <div class="tab active">
            <span class="tab-icon">{{ formPublished ? '◧' : '◌' }}</span>
            <span class="tab-label">{{ formTitle || '未命名文章' }}</span>
            <span v-if="saveStatus === 'unsaved'" class="tab-dot"></span>
          </div>
        </div>

        <!-- Title -->
        <div class="title-area">
          <input ref="titleInput" v-model="formTitle" class="title-input" placeholder="未命名文章" @input="saveStatus = 'unsaved'; debouncedAutoSave()" />
        </div>

        <!-- Meta panel -->
        <div v-if="showMeta" class="meta-panel">
          <div class="meta-grid">
            <div class="meta-field">
              <label class="meta-label label">Slug</label>
              <input v-model="formSlug" class="meta-input caption" placeholder="auto-generated" />
            </div>
            <div class="meta-field">
              <label class="meta-label label">分类</label>
              <select v-model="formCategory" class="meta-select caption">
                <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="meta-field">
              <label class="meta-label label">标签</label>
              <input v-model="formTags" class="meta-input caption" placeholder="标签1, 标签2" />
            </div>
            <div class="meta-field meta-field--wide">
              <label class="meta-label label">摘要</label>
              <input v-model="formExcerpt" class="meta-input caption" placeholder="文章摘要..." />
            </div>
            <div class="meta-field meta-field--wide">
              <label class="meta-label label">封面图</label>
              <div class="meta-upload-row">
                <input v-model="formCoverImage" class="meta-input caption" placeholder="https://..." />
                <label class="upload-btn label">上传<input type="file" accept="image/*" hidden @change="handleImageUpload" /></label>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings panel -->
        <div v-if="showSettings" class="settings-panel">
          <div class="settings-row">
            <div class="settings-info">
              <span class="settings-label">自动保存</span>
              <span class="settings-desc caption">{{ autoSaveEnabled ? '输入停止 3 秒后自动保存' : '手动保存 (Ctrl+S)' }}</span>
            </div>
            <button
              :class="['toggle', { 'toggle--on': autoSaveEnabled }]"
              @click="autoSaveEnabled = !autoSaveEnabled"
              role="switch"
              :aria-checked="autoSaveEnabled"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>

        <!-- Custom Editor -->
        <div class="editor-body">
          <div class="editor-gutter" ref="gutterEl">
            <div v-for="n in lineNumbers" :key="n" class="gutter-line">{{ n }}</div>
          </div>
          <div class="editor-input-area">
            <textarea
              ref="textareaEl"
              :value="formContent"
              @input="onInput"
              @keydown="onKeydown"
              @scroll="syncScroll"
              class="editor-textarea"
              placeholder="开始写作..."
              spellcheck="false"
            ></textarea>
          </div>
        </div>

        <!-- Status Bar (in-editor) -->
        <footer class="status-bar">
          <div class="status-left">
            <span class="status-item">{{ lineCount }} 行</span>
            <span class="status-sep"></span>
            <span class="status-item">{{ charCount }} 字</span>
            <span class="status-sep"></span>
            <span class="status-item">Markdown</span>
            <span class="status-sep"></span>
            <span class="status-item" :class="{ 'status-item--unsaved': saveStatus === 'unsaved' }">
              {{ { saved: '已保存', unsaved: '未保存', saving: '保存中...' }[saveStatus] }}
            </span>
            <span class="status-sep"></span>
            <span class="status-item" :class="{ 'status-item--unsaved': autoSaveEnabled }">{{ autoSaveEnabled ? '自动' : '手动' }}</span>
          </div>
          <div class="status-right">
            <button v-if="currentId" class="status-action" @click="deleteArticle(currentId)">删除</button>
            <span class="status-sep"></span>
            <button class="status-action" @click="saveCurrentArticle()">保存</button>
            <button class="status-action status-action--primary" @click="saveCurrentArticle(!formPublished)">
              {{ formPublished ? '已发布' : '发布' }}
            </button>
          </div>
        </footer>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   Writing Workbench · Bauhaus Edition
   ═══════════════════════════════════════════ */
.workbench {
  display: flex;
  height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
  overflow: hidden;
}

/* ── Activity Bar ── */
.activity-bar {
  width: 48px;
  min-width: 48px;
  background: var(--color-primary-deep);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) 0;
  z-index: 10;
}

.activity-top, .activity-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xs);
}

.activity-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-reversed);
  opacity: 0.5;
  cursor: pointer;
  border: none;
  background: none;
  transition: all var(--duration-fast);
  text-decoration: none;
}
.activity-icon:hover { opacity: 0.8; background: oklch(100% 0 0 / 0.1); }
.activity-icon.active { opacity: 1; border-left: 2px solid var(--color-reversed); background: oklch(100% 0 0 / 0.08); }

/* ── Side Bar ── */
.side-bar {
  width: 280px;
  min-width: 250px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-alt);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
}

.side-bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-sm);
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  user-select: none;
  border-bottom: 1px solid var(--color-border);
}

.side-bar-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--duration-fast);
}
.side-bar-btn:hover { color: var(--color-text); }

.side-bar-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px solid var(--color-border);
}

.side-bar-search { flex: 1; }

.side-bar-input {
  width: 100%;
  padding: var(--space-2xs) var(--space-xs);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.75rem;
  transition: border-color var(--duration-fast);
}
.side-bar-input::placeholder { color: var(--color-text-secondary); }
.side-bar-input:focus { outline: none; border-color: var(--color-primary); }

.side-bar-new-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
  flex-shrink: 0;
}
.side-bar-new-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

/* ── Category pills ── */
.cat-pills {
  display: flex;
  gap: 1px;
  padding: var(--space-2xs) var(--space-sm);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-alt);
  overflow-x: auto;
}

.cat-pill {
  padding: 3px 12px;
  font-size: 0.75rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
  white-space: nowrap;
  letter-spacing: 0.04em;
}
.cat-pill:hover {
  color: var(--color-primary);
  background: oklch(48% 0.22 30 / 0.06);
}
.cat-pill.active {
  background: var(--color-primary);
  color: var(--color-reversed);
}

.side-bar-items { flex: 1; overflow-y: auto; padding: 0; }

.side-bar-items .side-bar-empty {
  padding: var(--space-xl) var(--space-md);
  text-align: center;
  color: var(--color-text-secondary);
}

/* ── Section groups ── */
.section-group {
  border-bottom: 1px solid var(--color-border);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  width: 100%;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-bg-alt);
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background var(--duration-fast);
  user-select: none;
}
.section-header:hover {
  background: var(--color-border);
}

.section-arrow {
  flex-shrink: 0;
  transition: transform var(--duration-fast);
}
.section-arrow.open {
  transform: rotate(90deg);
}

.section-label {
  flex: 1;
  text-align: left;
}

.section-count {
  font-size: 0.6rem;
  color: var(--color-text-secondary);
  background: var(--color-border);
  padding: 1px 6px;
  border-radius: 0;
}

.section-items {
  padding: var(--space-2xs) 0;
}

.section-empty {
  padding: var(--space-md) var(--space-md);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.7rem;
}

.side-bar-loading { padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-sm); }

.skeleton-line {
  height: 40px;
  background: var(--color-border);
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.side-bar-item {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 6px var(--space-sm);
  cursor: pointer;
  transition: background var(--duration-fast);
  position: relative;
}
.side-bar-item:hover { background: var(--color-border); }
.side-bar-item.active { background: var(--color-bg); border: 1px solid var(--color-border); }

.file-icon { width: 16px; text-align: center; font-size: 0.75rem; color: var(--color-text-secondary); flex-shrink: 0; }

.file-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }

.file-name { font-size: 0.8rem; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.file-meta { font-size: 0.6rem; color: var(--color-text-secondary); }

.file-delete {
  width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
  background: none; border: none; color: var(--color-text-secondary); cursor: pointer;
  opacity: 0; transition: all var(--duration-fast); flex-shrink: 0;
}
.side-bar-item:hover .file-delete { opacity: 0.4; }
.file-delete:hover { opacity: 1 !important; color: oklch(55% 0.2 30); }

.side-bar-empty { padding: var(--space-lg) var(--space-md); text-align: center; color: var(--color-text-secondary); }

/* ── Editor Panel ── */
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--color-bg);
  overflow: hidden;
}

/* Welcome */
.editor-welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  color: var(--color-text-secondary);
}

.welcome-block { width: 48px; height: 48px; background: var(--color-primary); opacity: 0.1; }

.editor-welcome .title { color: var(--color-text); font-size: 1.25rem; }

.welcome-desc { color: var(--color-text-secondary); }

.welcome-actions { display: flex; flex-direction: column; align-items: center; gap: var(--space-sm); margin-top: var(--space-sm); }

.welcome-btn { padding: var(--space-xs) var(--space-lg); background: var(--color-text); color: var(--color-bg); border: none; cursor: pointer; transition: background var(--duration-fast); }
.welcome-btn:hover { background: var(--color-primary); }

/* Active editor */
.editor-active { flex: 1; display: flex; flex-direction: column; min-height: 0; }

/* Tab bar */
.tab-bar {
  display: flex;
  background: var(--color-bg-alt);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.tab {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 6px 16px;
  background: var(--color-bg);
  border-right: 1px solid var(--color-border);
  cursor: default;
  user-select: none;
  margin-bottom: -1px;
  border-bottom: 1px solid var(--color-bg);
}

.tab-icon { font-size: 0.65rem; color: var(--color-text-secondary); }

.tab-label { font-size: 0.8rem; color: var(--color-text); }

.tab-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-primary); }

/* Title area */
.title-area { padding: var(--space-lg) var(--space-xl) 0; flex-shrink: 0; }

.title-input {
  width: 100%;
  border: none;
  background: none;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  padding: 0;
  outline: none;
}
.title-input::placeholder { color: var(--color-text-secondary); opacity: 0.4; }

/* Meta panel */
.meta-panel { padding: var(--space-sm) var(--space-xl); flex-shrink: 0; }

.meta-grid { display: flex; flex-wrap: wrap; gap: var(--space-xs); }

.meta-field { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 180px; }
.meta-field--wide { flex: 2; min-width: 100%; }

.meta-label { font-size: 0.6rem; color: var(--color-text-secondary); letter-spacing: 0.05em; text-transform: uppercase; }

.meta-input {
  padding: var(--space-2xs) var(--space-xs); background: var(--color-bg);
  border: 1px solid var(--color-border); color: var(--color-text);
  font-family: var(--font-body); font-size: 0.75rem; transition: border-color var(--duration-fast);
}
.meta-input::placeholder { color: var(--color-text-secondary); }
.meta-input:focus { outline: none; border-color: var(--color-primary); }

.meta-select {
  padding: var(--space-2xs) var(--space-xs);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.75rem;
  transition: border-color var(--duration-fast);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='6' viewBox='0 0 8 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l3 4 3-4' stroke='%23666' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 24px;
}
.meta-select:focus { outline: none; border-color: var(--color-primary); }

.meta-upload-row { display: flex; gap: var(--space-2xs); }
.meta-upload-row .meta-input { flex: 1; }

.upload-btn {
  display: inline-flex; align-items: center; padding: var(--space-2xs) var(--space-xs);
  background: var(--color-bg-alt); border: 1px solid var(--color-border);
  cursor: pointer; font-size: 0.6rem; color: var(--color-text-secondary);
  white-space: nowrap; transition: all var(--duration-fast);
}
.upload-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

/* ═══════════════════════════════════════════
   Settings Panel
   ═══════════════════════════════════════════ */
.settings-panel {
  padding: var(--space-sm) var(--space-xl);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-alt);
  flex-shrink: 0;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text);
}

.settings-desc {
  color: var(--color-text-secondary);
  font-size: 0.7rem;
}

/* Toggle switch */
.toggle {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  border: none;
  background: var(--color-border);
  cursor: pointer;
  position: relative;
  transition: background var(--duration-fast);
  padding: 0;
  flex-shrink: 0;
}

.toggle--on {
  background: var(--color-primary);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-bg);
  transition: transform var(--duration-fast);
  box-shadow: 0 1px 2px oklch(0% 0 0 / 0.15);
}

.toggle--on .toggle-knob {
  transform: translateX(16px);
}

/* ═══════════════════════════════════════════
   Custom Editor
   ═══════════════════════════════════════════ */
.editor-body {
  flex: 1;
  display: flex;
  min-height: 0;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
  overflow: hidden;
}

/* Line number gutter */
.editor-gutter {
  width: 56px;
  min-width: 56px;
  padding: var(--space-lg) 0;
  background: var(--color-bg-alt);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
  text-align: right;
  user-select: none;
}

.gutter-line {
  padding: 0 var(--space-sm) 0 0;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.8;
  color: var(--color-text-secondary);
  opacity: 0.35;
}

/* Textarea area */
.editor-input-area {
  flex: 1;
  display: flex;
  overflow: auto;
}

.editor-textarea {
  flex: 1;
  padding: var(--space-lg) var(--space-xl);
  border: none;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  line-height: 1.8;
  resize: none;
  outline: none;
  overflow: visible;
  min-height: 100%;
  tab-size: 2;
}

.editor-textarea::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.3;
}

.editor-textarea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.editor-textarea::-webkit-scrollbar-track {
  background: transparent;
}

.editor-textarea::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 0;
}

.editor-textarea::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

/* ── Status Bar ── */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-md);
  height: 22px;
  background: var(--color-primary);
  color: var(--color-reversed);
  flex-shrink: 0;
  font-size: 0.6rem;
  z-index: 10;
  gap: var(--space-2xs);
}

.status-left, .status-right { display: flex; align-items: center; gap: var(--space-2xs); }

.status-item { color: var(--color-reversed); opacity: 0.8; white-space: nowrap; }
.status-item--unsaved { opacity: 1; }

.status-sep { width: 1px; height: 10px; background: var(--color-reversed); opacity: 0.2; }

.status-action {
  padding: 0 6px; height: 22px; display: inline-flex; align-items: center;
  background: none; border: none; color: var(--color-reversed); opacity: 0.7;
  cursor: pointer; transition: opacity var(--duration-fast); font-size: 0.6rem; letter-spacing: 0.02em;
}
.status-action:hover { opacity: 1; }
.status-action--primary { opacity: 1; }
</style>
