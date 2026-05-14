from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api.deps.auth import get_current_user
from app.core.database import get_session
from app.models.user_account import UserAccount
from app.services.auth import get_role_map, require_form_access
from app.services.purchase_orders import get_purchase_order, list_purchase_orders


router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])


def ensure_purchase_order_access(current_user: UserAccount, session: Session) -> None:
    role_map = get_role_map(session)
    require_form_access(current_user, role_map, 'purchase_order')


@router.get("")
def read_purchase_orders(
    current_user: UserAccount = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    ensure_purchase_order_access(current_user, session)
    return list_purchase_orders(session)


@router.get("/{order_id}")
def read_purchase_order(
    order_id: str,
    current_user: UserAccount = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    ensure_purchase_order_access(current_user, session)
    order = get_purchase_order(session, order_id)

    if order is None:
        raise HTTPException(status_code=404, detail="Purchase order not found.")

    return order
