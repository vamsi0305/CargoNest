from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


FORM_ACCESS_OPTIONS = [
    'overview',
    'purchase_order',
    'stock_reglazing',
    'stock_repacking',
    'stock_sampling',
    'stock_inspection',
    'stock_pht',
    'shipment',
    'vehicle_details',
]


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)

    @field_validator('email')
    @classmethod
    def normalize_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if '@' not in cleaned or '.' not in cleaned.split('@')[-1]:
            raise ValueError('Please enter a valid email address.')
        return cleaned


class RoleCreate(BaseModel):
    name: str = Field(min_length=2)
    description: str = ''

    @field_validator('name')
    @classmethod
    def normalize_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError('Role name is required.')
        return cleaned


class RoleRead(BaseModel):
    id: int
    name: str
    description: str
    is_system: bool


class UserBase(BaseModel):
    username: str = Field(min_length=2)
    email: str
    role_id: int
    allowed_forms: list[str]
    is_active: bool = True

    @field_validator('username')
    @classmethod
    def normalize_username(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError('Username is required.')
        return cleaned

    @field_validator('email')
    @classmethod
    def normalize_user_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if '@' not in cleaned or '.' not in cleaned.split('@')[-1]:
            raise ValueError('Please enter a valid email address.')
        return cleaned


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=2)
    email: str | None = None
    role_id: int | None = None
    allowed_forms: list[str] | None = None
    password: str | None = Field(default=None, min_length=8)
    is_active: bool | None = None

    @field_validator('username')
    @classmethod
    def normalize_optional_username(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else value

    @field_validator('email')
    @classmethod
    def normalize_optional_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip().lower()
        if '@' not in cleaned or '.' not in cleaned.split('@')[-1]:
            raise ValueError('Please enter a valid email address.')
        return cleaned


class UserRead(BaseModel):
    id: int
    username: str
    email: str
    role_id: int | None
    role_name: str
    allowed_forms: list[str]
    is_active: bool
    created_at: datetime


class AuthSessionResponse(BaseModel):
    user: UserRead


class MeResponse(BaseModel):
    user: UserRead


class FormAccessOptionsResponse(BaseModel):
    options: list[str]


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8)


class AdminAuditLogRead(BaseModel):
    id: int
    actor_user_id: int | None
    actor_username: str
    action: str
    target_type: str
    target_id: int | None
    target_label: str
    summary: str
    details: dict[str, Any]
    created_at: datetime
