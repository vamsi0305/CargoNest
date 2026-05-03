import { getApiBaseUrl, getCsrfHeaders } from '../features/auth/session'

type FrontendErrorInput = {
  message: string
  source: string
  stack?: string
  componentStack?: string
  severity?: 'error' | 'warning' | 'info'
}

let globalHandlersInstalled = false

function normalizeErrorMessage(error: unknown): { message: string; stack: string } {
  if (error instanceof Error) {
    return {
      message: error.message || error.name || 'Unknown error',
      stack: error.stack ?? '',
    }
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown error',
    stack: '',
  }
}

export async function reportFrontendError(input: FrontendErrorInput) {
  try {
    await fetch(`${getApiBaseUrl()}/telemetry/frontend-errors`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getCsrfHeaders(),
      },
      body: JSON.stringify({
        message: input.message,
        source: input.source,
        url: window.location.href,
        user_agent: window.navigator.userAgent,
        stack: input.stack ?? '',
        component_stack: input.componentStack ?? '',
        severity: input.severity ?? 'error',
      }),
    })
  } catch {
    // Monitoring should never break the user flow.
  }
}

export function buildApiErrorMessage(response: Response, fallback: string, detail?: string) {
  const requestId = response.headers.get('X-Request-ID')
  const baseMessage = detail || fallback
  return requestId ? `${baseMessage} (Request ID: ${requestId})` : baseMessage
}

export function installGlobalErrorHandlers() {
  if (globalHandlersInstalled) {
    return
  }

  globalHandlersInstalled = true

  window.addEventListener('error', (event) => {
    void reportFrontendError({
      source: 'window_error',
      message: event.message || 'Unhandled browser error',
      stack: event.error instanceof Error ? event.error.stack : '',
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const normalized = normalizeErrorMessage(event.reason)
    void reportFrontendError({
      source: 'unhandled_rejection',
      message: normalized.message,
      stack: normalized.stack,
    })
  })
}

export function reportAsyncError(source: string, error: unknown) {
  const normalized = normalizeErrorMessage(error)
  void reportFrontendError({
    source,
    message: normalized.message,
    stack: normalized.stack,
  })
}
