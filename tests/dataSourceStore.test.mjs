import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useDataSourceStore } from '../src/stores/dataSourceStore.js'

test('addApiDataSource creates an api data source bound to a requester path', () => {
  setActivePinia(createPinia())
  const store = useDataSourceStore()

  const dataSource = store.addApiDataSource({
    name: '用户列表',
    requesterId: 'default',
    method: 'POST',
    path: '/users',
    queryRows: [{ key: 'page', value: '1', enabled: true }],
    headerRows: [{ key: 'X-Trace', value: 'abc', enabled: true }],
    body: { active: true }
  })

  assert.equal(dataSource.type, 'api')
  assert.equal(dataSource.name, '用户列表')
  assert.equal(dataSource.requesterId, 'default')
  assert.deepEqual(dataSource.requestConfig, {
    method: 'POST',
    path: '/users',
    queryRows: [{ key: 'page', value: '1', enabled: true }],
    headerRows: [{ key: 'X-Trace', value: 'abc', enabled: true }],
    body: { active: true },
    mapping: {}
  })
  assert.equal(store.dataSources.length, 1)
})

test('fetchData stores last success result with raw data', async () => {
  setActivePinia(createPinia())
  const store = useDataSourceStore()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ items: [{ name: 'A' }] })
  })

  try {
    const dataSource = store.addApiDataSource({
      name: '用户列表',
      requesterId: 'default',
      path: '/users'
    })

    const result = await store.fetchData(dataSource.id)

    assert.deepEqual(result, { items: [{ name: 'A' }] })
    assert.equal(store.lastRequestResults[dataSource.id].status, 'success')
    assert.deepEqual(store.lastRequestResults[dataSource.id].rawData, { items: [{ name: 'A' }] })
    assert.deepEqual(store.lastRequestResults[dataSource.id].transformedData, { items: [{ name: 'A' }] })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchData stores last failed result', async () => {
  setActivePinia(createPinia())
  const store = useDataSourceStore()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({})
  })

  try {
    const dataSource = store.addApiDataSource({
      name: '异常接口',
      requesterId: 'default',
      path: '/broken'
    })

    await assert.rejects(() => store.fetchData(dataSource.id), /HTTP 500/)
    assert.equal(store.lastRequestResults[dataSource.id].status, 'failed')
    assert.match(store.lastRequestResults[dataSource.id].detail, /HTTP 500/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchData applies persisted data source transform', async () => {
  setActivePinia(createPinia())
  const store = useDataSourceStore()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => [{ name: 'A', count: 2 }]
  })

  try {
    const dataSource = store.addApiDataSource({
      name: '用户列表',
      requesterId: 'default',
      path: '/users'
    })

    store.updateDataSourceTransform(dataSource.id, {
      enabled: true,
      code: `function transform(data) {
  return data.map(item => ({ ...item, count: item.count * 10 }));
}`
    })

    const result = await store.fetchData(dataSource.id)

    assert.deepEqual(result, [{ name: 'A', count: 20 }])
    assert.deepEqual(store.lastRequestResults[dataSource.id].rawData, [{ name: 'A', count: 2 }])
    assert.deepEqual(store.lastRequestResults[dataSource.id].transformedData, [{ name: 'A', count: 20 }])
  } finally {
    globalThis.fetch = originalFetch
  }
})
