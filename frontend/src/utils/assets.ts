const externalUrlPattern = /^(?:[a-z][a-z\d+\-.]*:)?\/\//i
const browserUrlPattern = /^(?:data|blob):/i

function appBasePath() {
  return import.meta.env.BASE_URL || '/'
}

function joinBasePath(path: string) {
  const base = appBasePath()
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const normalizedPath = path.replace(/^\/+/, '')

  return `${normalizedBase}${normalizedPath}`
}

function isResolvedUrl(path: string) {
  return externalUrlPattern.test(path) || browserUrlPattern.test(path) || path.startsWith('#')
}

export function publicAssetUrl(path: string | null | undefined) {
  if (!path) return ''
  if (isResolvedUrl(path)) return path

  const base = appBasePath()
  if (base !== '/' && path.startsWith(base)) return path

  return joinBasePath(path)
}

export function publicImageUrl(path: string | null | undefined) {
  if (!path) return ''
  if (isResolvedUrl(path)) return path
  if (path.startsWith('/assets/') || path.startsWith('assets/')) {
    return publicAssetUrl(path)
  }
  if (path.includes('/')) {
    return publicAssetUrl(path)
  }

  return publicAssetUrl(`/assets/images/${path}`)
}

function cssUrl(url: string) {
  return `url("${url.replace(/["\\\n\r\f]/g, '\\$&')}")`
}

export function publicCssImageUrl(path: string | null | undefined) {
  const url = publicImageUrl(path)
  return url ? cssUrl(url) : ''
}

export function installAssetCssVariables(root: HTMLElement = document.documentElement) {
  root.style.setProperty(
    '--app-admin-bg-image',
    publicCssImageUrl('bg_admin_login.jpg'),
  )
}
