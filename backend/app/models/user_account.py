from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Column, DateTime, func
from sqlmodel import Field, SQLModel


class UserAccount(SQLModel, table=True):
    __tablename__ = 'user_accounts'

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    password_salt: str
    role_id: Optional[int] = Field(default=None, foreign_key='roles.id')
    allowed_forms: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
