const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

type SavePayload = {
  fields: Record<string, unknown>
  extra?: Record<string, unknown>
}

type PrefillResponse = {
  fields: Record<string, unknown>
  extra: Record<string, unknown>
}

export async function uploadAttachment(file: File) {
  const body = new FormData()
  body.append('file', file)

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    throw new Error('Unable to upload file.')
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  })

  if (!response.ok) {
    throw new Error('Unable to save form data.')
  }

  return response.json()
}

export async function fetchCargoPrefill(formType: string, cargoNo: string) {
  const response = await fetch(
    `${API_BASE_URL}/forms/prefill/${formType}/${encodeURIComponent(cargoNo)}`,
  )

  if (!response.ok) {
    throw new Error('Unable to load cargo prefill data.')
  }

  return response.json() as Promise<PrefillResponse>
}

export async function fetchOverview() {
  const response = await fetch(`${API_BASE_URL}/forms/overview/all`)

  if (!response.ok) {
    throw new Error('Unable to load overview data.')
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
