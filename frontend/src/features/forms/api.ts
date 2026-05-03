import { getApiBaseUrl, getCsrfHeaders } from '../auth/session'
import { buildApiErrorMessage } from '../../lib/monitoring'

const API_BASE_URL = getApiBaseUrl()

type SavePayload = {
  fields: Record<string, unknown>
  extra?: Record<string, unknown>
}

type PrefillResponse = {
  fields: Record<string, unknown>
  extra: Record<string, unknown>
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

export async function uploadAttachment(file: File) {
  const body = new FormData()
  body.append('file', file)

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...getCsrfHeaders() },
    body,
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to upload file.')
  }

  return response.json() as Promise<{
    file_name: string
    stored_name: string
    file_url: string
  }>
}

export async function saveFormSubmission(formType: string, payload: SavePayload) {
  const response = await fetch(`${API_BASE_URL}/forms/${formType}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
    body: JSON.stringify({ payload }),
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to save form data.')
  }

  return response.json()
}

export async function fetchCargoPrefill(formType: string, cargoNo: string) {
  const response = await fetch(
    `${API_BASE_URL}/forms/prefill/${formType}/${encodeURIComponent(cargoNo)}`,
    {
      credentials: 'include',
    },
  )

  if (!response.ok) {
    await readApiError(response, 'Unable to load cargo prefill data.')
  }

  return response.json() as Promise<PrefillResponse>
}

export async function fetchOverview() {
  const response = await fetch(`${API_BASE_URL}/forms/overview/all`, {
    credentials: 'include',
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to load overview data.')
  }

  return response.json() as Promise<
    {
      id: number
      form_type: string
      created_at: string
      title: string
    }[]
  >
}
