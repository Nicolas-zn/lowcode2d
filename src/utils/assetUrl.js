const apiBase = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')

export function getAssetDisplayUrl(assetOrFile) {
  const file = assetOrFile?.file || assetOrFile
  if (!file) return ''

  if (file.objectKey && file.bucket && file.bucket !== 'metadata') {
    const objectKey = file.objectKey
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/')
    return `${apiBase}/assets/public/${objectKey}`
  }

  return file.url || ''
}
