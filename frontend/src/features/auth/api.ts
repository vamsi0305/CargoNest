import { getApiBaseUrl, getCsrfHeaders } from './session'
import type { AdminAuditLog, AuthSession, AuthUser, Role } from './types'
import { buildApiErrorMessage, reportAsyncError } from '../../lib/monitoring'

const API_BASE_URL = getApiBaseUrl()

type UserPayload = {
  username: string
  email: string
  password?: string
  role_id: number
  allowed_forms: string[]
  is_active: boolean
}

async function readApiError(response: Response, fallback: string) {
  let resolvedDetail: string | undefined
  try {
    const payload = await response.json() as { detail?: string }
    if (payload.detail) {
      resolvedDetail = payload.detail
    }
  } catch (error) {
    if (error instanceof Error && error.message !== 'Unexpected end of JSON input') {
      throw error
    }
  }

  throw new Error(buildApiErrorMessage(response, fallback, resolvedDetail))
}

export async function loginRequest(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    await readApiError(response, 'Invalid login credentials.')
  }

  return response.json() as Promise<AuthSession>
}

export async function fetchMe() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
  })

  if (!response.ok) {
    await readApiError(response, 'Session expired.')
  }

  return response.json() as Promise<{ user: AuthUser }>
}

export async function logoutRequest() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...getCsrfHeaders() },
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to log out.')
  }
}

export async function fetchRoles() {
  const response = await fetch(`${API_BASE_URL}/admin/roles`, {
    credentials: 'include',
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to load roles.')
  }

  return response.json() as Promise<Role[]>
}

export async function createRole(name: string, description: string) {
  const response = await fetch(`${API_BASE_URL}/admin/roles`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
    body: JSON.stringify({ name, description }),
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to create role.')
  }

  return response.json() as Promise<Role>
}

export async function fetchUsers() {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    credentials: 'include',
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to load users.')
  }

  return response.json() as Promise<AuthUser[]>
}

export async function fetchAuditLogs() {
  const response = await fetch(`${API_BASE_URL}/admin/audit-logs?limit=50`, {
    credentials: 'include',
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to load audit logs.')
  }

  return response.json() as Promise<AdminAuditLog[]>
}

export async function fetchFormAccessOptions() {
  const response = await fetch(`${API_BASE_URL}/admin/form-access-options`, {
    credentials: 'include',
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to load form access options.')
  }

  const payload = await response.json() as { options: string[] }
  return payload.options
}

export async function createUser(payload: UserPayload & { password: string }) {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to create user.')
  }

  return response.json() as Promise<AuthUser>
}

export async function updateUser(userId: number, payload: Partial<UserPayload> & { password?: string }) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to update user.')
  }

  return response.json() as Promise<AuthUser>
}

export async function logoutAllRequest() {
  const response = await fetch(`${API_BASE_URL}/auth/logout-all`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...getCsrfHeaders() },
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to end all sessions.')
  }
}

export async function changePasswordRequest(currentPassword: string, newPassword: string) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to change password.')
  }

  return response.json() as Promise<{ success: boolean; message: string }>
}

export function reportAuthApiFailure(source: string, error: unknown) {
  reportAsyncError(source, error)
}
