from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, func
from sqlmodel import Field, SQLModel


class UserSession(SQLModel, table=True):
    __tablename__ = 'user_sessions'

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key='user_accounts.id', index=True)
    token: str = Field(index=True, unique=True)
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
