from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Column, DateTime, func
from sqlmodel import Field, SQLModel


class FormSubmission(SQLModel, table=True):
    __tablename__ = "form_submissions"

    id: Optional[int] = Field(default=None, primary_key=True)
    form_type: str = Field(index=True)
    payload: dict[str, Any] = Field(sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
