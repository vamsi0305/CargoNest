from datetime import date
from typing import Optional

from sqlmodel import Field, SQLModel


class PurchaseOrder(SQLModel, table=True):
    __tablename__ = "purchase_orders"

    id: Optional[int] = Field(default=None, primary_key=True)
    cargo_no: str = Field(index=True, unique=True)
    po_no: str = Field(index=True)
    buyer: str
    agent_name: str
    destination: str
    po_date: date
    status: str = Field(default="draft")
    progress: int = Field(default=0)
    total_quantity_kg: float = Field(default=0)
    shipment_target: str
