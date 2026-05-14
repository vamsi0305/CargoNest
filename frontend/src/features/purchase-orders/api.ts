import { getApiBaseUrl } from '../auth/session'
import { buildApiErrorMessage } from '../../lib/monitoring'
import type { PurchaseOrder, PurchaseOrderListResponse } from './types'

const API_BASE_URL = getApiBaseUrl()

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

export async function fetchPurchaseOrders(): Promise<PurchaseOrderListResponse> {
  const response = await fetch(`${API_BASE_URL}/purchase-orders`, {
    credentials: 'include',
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to load purchase orders.')
  }

  return response.json()
}

export async function fetchPurchaseOrder(orderId: string): Promise<PurchaseOrder> {
  const response = await fetch(`${API_BASE_URL}/purchase-orders/${orderId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    await readApiError(response, 'Unable to load this purchase order.')
  }

  return response.json()
}
