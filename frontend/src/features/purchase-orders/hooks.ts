import { useQuery } from '@tanstack/react-query'

import { fetchPurchaseOrder, fetchPurchaseOrders } from './api'

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: fetchPurchaseOrders,
  })
}

export function usePurchaseOrder(orderId: string) {
  return useQuery({
    queryKey: ['purchase-order', orderId],
    queryFn: () => fetchPurchaseOrder(orderId),
  })
}
