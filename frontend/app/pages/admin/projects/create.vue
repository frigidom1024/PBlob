<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const router = useRouter()

const form = reactive({
  title: '',
  excerpt: '',
  content: '',
  tags: '',
  cover_image: '',
  url: '',
  published: false,
})

const saving = ref(false)
const error = ref('')
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null)

async function save(publish: boolean) {
  saving.value = true
  error.value = ''
  try {
    const tags = form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    await api.createProject({
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      tags,
      cover_image: form.cover_image || null,
      url: form.url || null,
      published: publish,
    })
    router.push('/admin/projects')
  } catch (e: any) {
    error.value = e?.data?.error?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const res = await api.uploadImage(file)
    if (editorRef.value) editorRef.value.insertImage(res.data.url)
  } catch {
    error.value = '上传失败'
  }
}
</script>

<template>
  <div class="editor-page">
    <div class="page-header">
      <h1 class="title">添加项目</h1>
      <div class="header-actions">
        <button :disabled="saving" class="page-btn label" @click="save(false)">保存草稿</button>
        <button :disabled="saving" class="page-btn page-btn--primary label" @click="save(true)">发布</button>
      </div>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="editor-form">
      <div class="form-group">
        <label class="form-label label">标题 *</label>
        <input v-model="form.title" class="form-input form-input--title" placeholder="项目名称" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label label">标签</label>
          <input v-model="form.tags" class="form-input" placeholder="标签1, 标签2" />
        </div>
        <div class="form-group">
          <label class="form-label label">外部链接</label>
          <input v-model="form.url" class="form-input" placeholder="https://..." />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label label">摘要</label>
        <textarea v-model="form.excerpt" class="form-input form-textarea" rows="2" placeholder="项目简介"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label label">封面图</label>
        <div class="form-upload-row">
          <input v-model="form.cover_image" class="form-input" placeholder="https://..." />
          <label class="upload-btn label">
            上传
            <input type="file" accept="image/*" hidden @change="handleImageUpload" />
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label label">正文 (可选)</label>
        <MarkdownEditor ref="editorRef" v-model="form.content" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-page { max-width: 900px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.header-actions { display: flex; gap: var(--space-sm); }
.page-btn { padding: var(--space-xs) var(--space-md); background: var(--color-bg-alt); border: 1px solid var(--color-border); cursor: pointer; transition: all var(--duration-fast); font-size: 0.75rem; }
.page-btn:hover { border-color: var(--color-primary); }
.page-btn--primary { background: var(--color-text); color: var(--color-bg); border-color: var(--color-text); }
.page-btn--primary:hover { background: var(--color-primary); border-color: var(--color-primary); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.form-error { padding: var(--space-xs) var(--space-sm); margin-bottom: var(--space-md); background: oklch(90% 0.1 30 / 0.2); color: oklch(55% 0.2 30); font-size: 0.85rem; }
.editor-form { display: flex; flex-direction: column; gap: var(--space-md); }
.form-group { display: flex; flex-direction: column; gap: var(--space-2xs); }
.form-label { font-size: 0.75rem; color: var(--color-text-secondary); }
.form-input { padding: var(--space-xs) var(--space-sm); border: 1px solid var(--color-border); background: var(--color-bg); font-family: var(--font-body); font-size: 0.9rem; transition: border-color var(--duration-fast); }
.form-input:focus { outline: none; border-color: var(--color-primary); }
.form-input--title { font-size: 1.25rem; font-weight: 600; }
.form-textarea { resize: vertical; min-height: 60px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.form-upload-row { display: flex; gap: var(--space-xs); }
.form-upload-row .form-input { flex: 1; }
.upload-btn { display: inline-flex; align-items: center; padding: var(--space-xs) var(--space-md); background: var(--color-bg-alt); border: 1px solid var(--color-border); cursor: pointer; font-size: 0.75rem; transition: all var(--duration-fast); white-space: nowrap; }
.upload-btn:hover { border-color: var(--color-primary); }
</style>
