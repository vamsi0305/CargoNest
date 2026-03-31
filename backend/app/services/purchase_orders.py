from app.schemas.purchase_order import (
    PurchaseOrderListResponse,
    PurchaseOrderMetrics,
    PurchaseOrderRead,
)


def list_purchase_orders() -> PurchaseOrderListResponse:
    return PurchaseOrderListResponse(
        items=[],
        metrics=PurchaseOrderMetrics(
            active_orders=0,
            pending_shipments=0,
            quality_checks_due=0,
            cold_chain_alerts=0,
        ),
        source='database',
    )


def get_purchase_order(order_id: str) -> PurchaseOrderRead | None:
    return None
