import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const editorSource = readFileSync(resolve(__dirname, '../src/components/LightCodeEditor.vue'), 'utf8')
const dataSourcePanelSource = readFileSync(resolve(__dirname, '../src/components/DataSourcePanel.vue'), 'utf8')

test('LightCodeEditor wraps Monaco Editor for a VS Code like editing surface', () => {
  assert.match(editorSource, /defineProps/)
  assert.match(editorSource, /update:modelValue/)
  assert.match(editorSource, /monaco-editor/)
  assert.match(editorSource, /MonacoEnvironment/)
  assert.match(editorSource, /getWorker/)
  assert.match(editorSource, /monaco\.editor\.create/)
  assert.match(editorSource, /onDidChangeModelContent/)
})

test('DataSourcePanel uses LightCodeEditor for transform code', () => {
  assert.match(dataSourcePanelSource, /LightCodeEditor/)
  assert.doesNotMatch(dataSourcePanelSource, /class="script-input"/)
})
