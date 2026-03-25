from datetime import date

from pydantic import BaseModel


class PurchaseOrderRead(BaseModel):
    id: str
    cargo_no: str
    po_no: str
    buyer: str
    agent_name: str
    destination: str
    po_date: date
    status: str
    progress: int
    total_quantity_kg: float
    shipment_target: str


class PurchaseOrderMetrics(BaseModel):
    active_orders: int
    pending_shipments: int
    quality_checks_due: int
    cold_chain_alerts: int


class PurchaseOrderListResponse(BaseModel):
    items: list[PurchaseOrderRead]
    metrics: PurchaseOrderMetrics
    source: str
