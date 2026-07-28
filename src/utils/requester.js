export const createKeyValueRow = (key = '', value = '', enabled = true) => ({
  key,
  value,
  enabled
})

export const normalizeKeyValueRows = (rows = []) => {
  return rows.reduce((result, row) => {
    if (!row || row.enabled === false) return result
    const key = String(row.key || '').trim()
    if (!key) return result
    result[key] = row.value ?? ''
    return result
  }, {})
}

export const parseJsonText = (text, fallback = null) => {
  if (!String(text || '').trim()) return fallback
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('JSON 格式错误')
  }
}

export const buildRequesterUrl = ({ baseUrl = '', path = '', queryRows = [] }) => {
  const cleanBase = String(baseUrl || '').replace(/\/+$/, '')
  const cleanPath = String(path || '').replace(/^\/+/, '')
  const url = cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase
  const query = normalizeKeyValueRows(queryRows)
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    params.append(key, value)
  })

  const queryString = params.toString()
  return queryString ? `${url}${url.includes('?') ? '&' : '?'}${queryString}` : url
}

export const buildRequesterHeaders = ({ requester = {}, headerRows = [] }) => {
  const headers = {
    ...(requester.headers || {}),
    ...normalizeKeyValueRows(headerRows)
  }
  const auth = requester.auth || {}

  if (auth.type === 'bearer' && auth.token) {
    headers.Authorization = `Bearer ${auth.token}`
  }

  if (auth.type === 'basic' && auth.username) {
    headers.Authorization = `Basic ${btoa(`${auth.username}:${auth.password || ''}`)}`
  }

  if (auth.type === 'apiKey' && auth.keyName) {
    headers[auth.keyName] = auth.keyValue || ''
  }

  return headers
}

export const createRequesterDataSourceConfig = ({ requester, requestConfig }) => ({
  url: buildRequesterUrl({
    baseUrl: requester?.baseUrl || '',
    path: requestConfig?.path || requestConfig?.suffix || '',
    queryRows: requestConfig?.queryRows || []
  }),
  method: requestConfig?.method || 'GET',
  headers: buildRequesterHeaders({
    requester,
    headerRows: requestConfig?.headerRows || []
  }),
  body: requestConfig?.body ?? null
})

export const describeDataSourceRequest = ({ dataSource, requester }) => {
  if (!dataSource) {
    return {
      title: '未配置接口',
      description: '点击配置接口选择数据源或自定义请求'
    }
  }

  const method = dataSource.requestConfig?.method || dataSource.config?.method || 'GET'
  const path = dataSource.requestConfig?.path || dataSource.config?.url || ''
  const requesterName = requester?.name || '未选择请求器'

  return {
    title: dataSource.name || requesterName || '已配置接口',
    description: `${requesterName} · ${method} ${path}`.trim()
  }
}

export const hasLegacyApiRequestConfig = (apiConfig) => {
  if (!apiConfig?.url) return false

  const protocol = String(apiConfig.protocol || '').toUpperCase()
  const url = String(apiConfig.url || '').trim()
  const isWs = protocol === 'WS' || url.startsWith('ws://') || url.startsWith('wss://')
  if (isWs) return Boolean(url)

  return Boolean(String(apiConfig.suffix || '').trim())
}
