<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import MarkdownIt from 'markdown-it'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorEl = ref<HTMLElement | null>(null)
const previewEl = ref<HTMLElement | null>(null)
const showPreview = ref(false)
let view: EditorView | null = null

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

onMounted(() => {
  if (!editorEl.value) return

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      emit('update:modelValue', update.state.doc.toString())
    }
  })

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      markdown({ base: markdownLanguage }),
      oneDark,
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      updateListener,
      EditorView.theme({
        '&': { height: '100%', fontSize: '14px' },
        '.cm-scroller': { fontFamily: "'JetBrains Mono', monospace", lineHeight: '1.7' },
      }),
    ],
  })

  view = new EditorView({ state, parent: editorEl.value })
})

onBeforeUnmount(() => {
  view?.destroy()
})

watch(() => props.modelValue, (newVal) => {
  if (view && newVal !== view.state.doc.toString()) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newVal },
    })
  }
})

function insertImage(url: string) {
  if (!view) return
  const pos = view.state.selection.main.head
  view.dispatch({
    changes: { from: pos, insert: `![图片](${url})\n` },
  })
}

function getPreviewHtml() {
  return md.render(props.modelValue || '')
}

defineExpose({ insertImage })
</script>

<template>
  <div class="markdown-editor">
    <div class="editor-toolbar">
      <label class="toolbar-label">正文 (Markdown)</label>
      <button class="toolbar-btn label" @click="showPreview = !showPreview">
        {{ showPreview ? '编辑' : '预览' }}
      </button>
    </div>
    <div class="editor-body">
      <div ref="editorEl" class="editor-cm" :class="{ 'editor-cm--hidden': showPreview }"></div>
      <div
        v-if="showPreview"
        ref="previewEl"
        class="editor-preview prose"
        v-html="getPreviewHtml()"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-bg-alt);
  border-bottom: 1px solid var(--color-border);
}
.toolbar-label { font-size: 0.75rem; color: var(--color-text-secondary); }
.toolbar-btn {
  font-size: 0.7rem;
  padding: 0.25em 0.75em;
  background: none;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out-quart);
}
.toolbar-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.editor-body { min-height: 400px; }
.editor-cm { height: 500px; }
.editor-cm--hidden { display: none; }
.editor-preview {
  height: 500px;
  overflow-y: auto;
  padding: var(--space-md);
}
</style>
