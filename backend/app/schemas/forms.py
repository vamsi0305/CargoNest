from datetime import datetime
from typing import Any

from pydantic import BaseModel


class FormSubmissionCreate(BaseModel):
    payload: dict[str, Any]


class FormSubmissionRead(BaseModel):
    id: int
    form_type: str
    payload: dict[str, Any]
    created_at: datetime


class OverviewItem(BaseModel):
    id: int
    form_type: str
    created_at: datetime
    title: str


class FormPrefillResponse(BaseModel):
    fields: dict[str, Any]
    extra: dict[str, Any]


class FileUploadResponse(BaseModel):
    file_name: str
    stored_name: str
    file_url: str
