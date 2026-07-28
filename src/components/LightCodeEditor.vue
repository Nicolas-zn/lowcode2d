<template>
  <div class="light-code-editor" :class="{ focused: isFocused }">
    <div class="editor-toolbar" v-if="title || $slots.actions">
      <span class="editor-title">{{ title }}</span>
      <div class="editor-actions">
        <slot name="actions" />
      </div>
    </div>
    <div ref="containerRef" class="monaco-host" />
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution'

if (typeof self !== 'undefined') {
  self.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'typescript' || label === 'javascript') return new TsWorker()
      return new EditorWorker()
    }
  }
}

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  theme: {
    type: String,
    default: 'vs'
  },
  options: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const isFocused = ref(false)
let editor = null
let model = null
let resizeObserver = null

const baseOptions = {
  automaticLayout: false,
  bracketPairColorization: { enabled: true },
  contextmenu: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
  fontSize: 13,
  formatOnPaste: true,
  formatOnType: true,
  glyphMargin: false,
  lineHeight: 22,
  lineNumbers: 'on',
  minimap: { enabled: false },
  padding: { top: 12, bottom: 12 },
  renderLineHighlight: 'all',
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  suggestOnTriggerCharacters: true,
  tabSize: 2,
  wordWrap: 'off'
}

onMounted(async () => {
  await nextTick()
  createEditor()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  editor?.dispose()
  model?.dispose()
})

watch(() => props.modelValue, (value) => {
  if (!model || model.getValue() === value) return
  model.setValue(value || '')
})

watch(() => props.language, (language) => {
  if (model) {
    monaco.editor.setModelLanguage(model, language || 'javascript')
  }
})

watch(() => props.theme, (theme) => {
  monaco.editor.setTheme(theme || 'vs')
})

watch(() => props.options, () => {
  editor?.updateOptions({
    ...baseOptions,
    ...props.options
  })
}, { deep: true })

const createEditor = () => {
  if (!containerRef.value || editor) return

  model = monaco.editor.createModel(props.modelValue || props.placeholder || '', props.language)
  if (!props.modelValue && props.placeholder) {
    model.setValue('')
  }

  editor = monaco.editor.create(containerRef.value, {
    ...baseOptions,
    ...props.options,
    model,
    theme: props.theme
  })

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', model.getValue())
  })

  editor.onDidFocusEditorText(() => {
    isFocused.value = true
  })

  editor.onDidBlurEditorText(() => {
    isFocused.value = false
  })

  resizeObserver = new ResizeObserver(() => {
    editor?.layout()
  })
  resizeObserver.observe(containerRef.value)

  nextTick(() => editor?.layout())
}
</script>

<style scoped>
.light-code-editor {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-bg-color);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.light-code-editor.focused {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
}

.editor-toolbar {
  flex: 0 0 auto;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.editor-title {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-actions {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.monaco-host {
  flex: 1;
  min-height: 0;
}
</style>
