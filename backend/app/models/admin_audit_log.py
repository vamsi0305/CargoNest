from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Column, DateTime, func
from sqlmodel import Field, SQLModel


class AdminAuditLog(SQLModel, table=True):
    __tablename__ = 'admin_audit_logs'

    id: Optional[int] = Field(default=None, primary_key=True)
    actor_user_id: Optional[int] = Field(default=None, index=True)
    actor_username: str
    action: str = Field(index=True)
    target_type: str = Field(index=True)
    target_id: Optional[int] = Field(default=None, index=True)
    target_label: str
    summary: str
    details: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
