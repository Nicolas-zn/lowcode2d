import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildRequesterHeaders,
  buildRequesterUrl,
  describeDataSourceRequest,
  hasLegacyApiRequestConfig,
  normalizeKeyValueRows,
  parseJsonText,
  createRequesterDataSourceConfig
} from '../src/utils/requester.js'

test('buildRequesterUrl joins base url, path, and query rows', () => {
  const url = buildRequesterUrl({
    baseUrl: 'https://api.example.com/root/',
    path: '/items',
    queryRows: [
      { key: 'page', value: '1', enabled: true },
      { key: 'empty', value: '', enabled: true },
      { key: 'disabled', value: 'x', enabled: false }
    ]
  })

  assert.equal(url, 'https://api.example.com/root/items?page=1&empty=')
})

test('buildRequesterHeaders merges requester headers, overrides, and bearer auth', () => {
  const headers = buildRequesterHeaders({
    requester: {
      headers: { Accept: 'application/json' },
      auth: { type: 'bearer', token: 'abc' }
    },
    headerRows: [
      { key: 'X-Trace', value: '1', enabled: true },
      { key: 'Skip', value: '0', enabled: false }
    ]
  })

  assert.deepEqual(headers, {
    Accept: 'application/json',
    'X-Trace': '1',
    Authorization: 'Bearer abc'
  })
})

test('normalizeKeyValueRows ignores incomplete rows and disabled rows', () => {
  assert.deepEqual(
    normalizeKeyValueRows([
      { key: 'a', value: '1', enabled: true },
      { key: '', value: '2', enabled: true },
      { key: 'b', value: '3', enabled: false }
    ]),
    { a: '1' }
  )
})

test('parseJsonText returns fallback for blank text and throws useful errors', () => {
  assert.deepEqual(parseJsonText('', { ok: true }), { ok: true })
  assert.throws(() => parseJsonText('{bad}', null), /JSON 格式错误/)
})

test('describeDataSourceRequest formats requester based data sources', () => {
  const summary = describeDataSourceRequest({
    dataSource: {
      name: '用户列表',
      requestConfig: { method: 'POST', path: '/users' }
    },
    requester: { name: '业务后端' }
  })

  assert.deepEqual(summary, {
    title: '用户列表',
    description: '业务后端 · POST /users'
  })
})

test('hasLegacyApiRequestConfig ignores default empty http api config', () => {
  assert.equal(hasLegacyApiRequestConfig(null), false)
  assert.equal(hasLegacyApiRequestConfig({ url: 'http://localhost:3001', protocol: 'HTTP', suffix: '' }), false)
  assert.equal(hasLegacyApiRequestConfig({ url: 'http://localhost:3001', protocol: 'HTTP', suffix: '/users' }), true)
  assert.equal(hasLegacyApiRequestConfig({ url: 'ws://localhost:3001', protocol: 'WS', suffix: '' }), true)
})

test('createRequesterDataSourceConfig returns request payload for panel display', () => {
  const config = createRequesterDataSourceConfig({
    requester: {
      baseUrl: 'https://api.example.com',
      headers: { Accept: 'application/json' },
      auth: { type: 'none' }
    },
    requestConfig: {
      method: 'GET',
      path: '/users',
      queryRows: [{ key: 'page', value: '1', enabled: true }],
      headerRows: [{ key: 'X-Trace', value: 'abc', enabled: true }],
      body: null
    }
  })

  assert.deepEqual(config, {
    url: 'https://api.example.com/users?page=1',
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Trace': 'abc'
    },
    body: null
  })
})
