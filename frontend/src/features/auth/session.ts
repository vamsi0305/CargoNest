const CSRF_COOKIE_NAME = 'cargonest_csrf'

function normalizeApiBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '')
}

const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
)

let serverIssuedCsrf: string | null = null

export function getApiBaseUrl() {
  return API_BASE_URL
}

/** Used after login /auth/me so CSRF works when the API is on a different site than the SPA (cookies are not readable cross-origin). */
export function setServerIssuedCsrf(token: string | null) {
  serverIssuedCsrf = token?.trim() || null
}

function readCookie(name: string) {
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.trim().split('=')
    if (key === name) {
      return decodeURIComponent(rest.join('='))
    }
  }

  return ''
}

export function getCsrfToken() {
  return readCookie(CSRF_COOKIE_NAME)
}

export function getCsrfHeaders(): Record<string, string> {
  const fromServer = serverIssuedCsrf
  if (fromServer) {
    return { 'X-CSRF-Token': fromServer }
  }
  const fromCookie = getCsrfToken()
  return fromCookie ? { 'X-CSRF-Token': fromCookie } : {}
}
