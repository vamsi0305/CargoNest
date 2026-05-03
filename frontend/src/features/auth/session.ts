const CSRF_COOKIE_NAME = 'cargonest_csrf'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export function getApiBaseUrl() {
  return API_BASE_URL
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
  const csrfToken = getCsrfToken()
  return csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
}
