from fastapi import APIRouter, HTTPException

from app.services.purchase_orders import get_purchase_order, list_purchase_orders


router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])


@router.get("")
def read_purchase_orders():
    return list_purchase_orders()


@router.get("/{order_id}")
def read_purchase_order(order_id: str):
    order = get_purchase_order(order_id)

    if order is None:
        raise HTTPException(status_code=404, detail="Purchase order not found.")

    return order
