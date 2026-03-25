export type PurchaseOrderStatus =
  | 'draft'
  | 'processing'
  | 'inspection'
  | 'shipment_ready'

export type PurchaseOrder = {
  id: string
  cargo_no: string
  po_no: string
  buyer: string
  agent_name: string
  destination: string
  po_date: string
  status: PurchaseOrderStatus
  progress: number
  total_quantity_kg: number
  shipment_target: string
}

export type PurchaseOrderMetrics = {
  active_orders: number
  pending_shipments: number
  quality_checks_due: number
  cold_chain_alerts: number
}

export type PurchaseOrderListResponse = {
  items: PurchaseOrder[]
  metrics: PurchaseOrderMetrics
  source: string
}
