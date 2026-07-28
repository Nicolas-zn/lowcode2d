import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sidebarSource = readFileSync(resolve(__dirname, '../src/components/Sidebar.vue'), 'utf8')

test('Sidebar renders a bottom account popover for logout', () => {
  assert.match(sidebarSource, /class="account-entry"/)
  assert.match(sidebarSource, /<UserFilled \/>/)
  assert.match(sidebarSource, /退出登录/)
  assert.match(sidebarSource, /authStore\.logout\(\)/)
})
