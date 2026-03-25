import type { PurchaseOrder, PurchaseOrderListResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

export async function fetchPurchaseOrders(): Promise<PurchaseOrderListResponse> {
  const response = await fetch(`${API_BASE_URL}/purchase-orders`)

  if (!response.ok) {
    throw new Error('Unable to load purchase orders.')
  }

  return response.json()
}

export async function fetchPurchaseOrder(orderId: string): Promise<PurchaseOrder> {
  const response = await fetch(`${API_BASE_URL}/purchase-orders/${orderId}`)

  if (!response.ok) {
    throw new Error('Unable to load this purchase order.')
  }

  return response.json()
}
