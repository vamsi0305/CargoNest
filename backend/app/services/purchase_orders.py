from datetime import date

from app.schemas.purchase_order import (
    PurchaseOrderListResponse,
    PurchaseOrderMetrics,
    PurchaseOrderRead,
)


SAMPLE_PURCHASE_ORDERS = [
    PurchaseOrderRead(
        id="po-101",
        cargo_no="CGN-24091",
        po_no="PO-8751",
        buyer="BlueWave Imports",
        agent_name="Arjun Cold Chain",
        destination="Tokyo, Japan",
        po_date=date(2026, 3, 22),
        status="processing",
        progress=68,
        total_quantity_kg=18450,
        shipment_target="2026-04-02",
    ),
    PurchaseOrderRead(
        id="po-102",
        cargo_no="CGN-24092",
        po_no="PO-8752",
        buyer="Nordic Ocean Foods",
        agent_name="Skyline Exports",
        destination="Oslo, Norway",
        po_date=date(2026, 3, 18),
        status="inspection",
        progress=54,
        total_quantity_kg=11200,
        shipment_target="2026-04-05",
    ),
    PurchaseOrderRead(
        id="po-103",
        cargo_no="CGN-24093",
        po_no="PO-8753",
        buyer="Atlantic Crest",
        agent_name="Harborline Agency",
        destination="Rotterdam, Netherlands",
        po_date=date(2026, 3, 15),
        status="draft",
        progress=21,
        total_quantity_kg=9450,
        shipment_target="2026-04-10",
    ),
    PurchaseOrderRead(
        id="po-104",
        cargo_no="CGN-24094",
        po_no="PO-8754",
        buyer="Pacific Table Co.",
        agent_name="Arjun Cold Chain",
        destination="Los Angeles, USA",
        po_date=date(2026, 3, 9),
        status="shipment_ready",
        progress=86,
        total_quantity_kg=22240,
        shipment_target="2026-03-30",
    ),
]


def list_purchase_orders() -> PurchaseOrderListResponse:
    return PurchaseOrderListResponse(
        items=SAMPLE_PURCHASE_ORDERS,
        metrics=PurchaseOrderMetrics(
            active_orders=14,
            pending_shipments=5,
            quality_checks_due=3,
            cold_chain_alerts=1,
        ),
        source="sample",
    )


def get_purchase_order(order_id: str) -> PurchaseOrderRead | None:
    return next((order for order in SAMPLE_PURCHASE_ORDERS if order.id == order_id), None)
