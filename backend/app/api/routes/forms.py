from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.form_submission import FormSubmission
from app.schemas.forms import (
    FileUploadResponse,
    FormSubmissionCreate,
    FormSubmissionRead,
    OverviewItem,
)

router = APIRouter(tags=["forms"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

SAMPLE_SUBMISSIONS: list[tuple[str, dict[str, Any]]] = [
    (
        "purchase_order",
        {
            "fields": {
                "cargo_no": "CGN-24091",
                "po_no": "PO-8751",
                "buyer": "BlueWave Imports",
                "year": "2026 - 2027",
            },
            "extra": {},
        },
    ),
    (
        "stock_reglazing",
        {
            "fields": {
                "cargo_no": "CGN-24091",
                "po_no": "PO-8751",
                "plant": "Plant 1",
            },
            "extra": {},
        },
    ),
    (
        "stock_repacking",
        {
            "fields": {
                "cargo_no": "CGN-24091",
                "po_no": "PO-8751",
            },
            "extra": {},
        },
    ),
    (
        "stock_sampling",
        {
            "fields": {
                "lab_name": "MarineLab Chennai",
                "sample_send_date": "20-03-2026",
            },
            "extra": {},
        },
    ),
    (
        "stock_inspection",
        {
            "fields": {
                "inspection": "SGS",
                "inspection_status": "Pass",
            },
            "extra": {},
        },
    ),
    (
        "stock_pht",
        {
            "fields": {
                "cargo_no": "CGN-24091",
                "type_of_pht_file": "",
            },
            "extra": {},
        },
    ),
    (
        "shipment",
        {
            "fields": {
                "cargo_no": "CGN-24091",
                "container_no": "MSCU3928104",
                "status": "In Transit",
            },
            "extra": {},
        },
    ),
    (
        "vehicle_details",
        {
            "fields": {
                "reference_id": "VEH-98341",
                "vehicle_no": "TN-22-AQ-7712",
                "movement_type": "Outbound",
            },
            "extra": {},
        },
    ),
]


def seed_sample_submissions(session: Session) -> None:
    existing_types = set(session.exec(select(FormSubmission.form_type)).all())

    added_any = False
    for form_type, payload in SAMPLE_SUBMISSIONS:
        if form_type in existing_types:
            continue

        session.add(FormSubmission(form_type=form_type, payload=payload))
        added_any = True

    if added_any:
        session.commit()


@router.post("/uploads", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")

    stored_name = f"{uuid4()}_{file.filename}"
    target = UPLOAD_DIR / stored_name

    content = await file.read()
    target.write_bytes(content)

    return FileUploadResponse(
        file_name=file.filename,
        stored_name=stored_name,
        file_url=f"/uploads/{stored_name}",
    )


@router.post("/forms/{form_type}", response_model=FormSubmissionRead)
def save_form_submission(
    form_type: str,
    payload: FormSubmissionCreate,
    session: Session = Depends(get_session),
):
    record = FormSubmission(form_type=form_type, payload=payload.payload)
    session.add(record)
    session.commit()
    session.refresh(record)

    return FormSubmissionRead(
        id=record.id,
        form_type=record.form_type,
        payload=record.payload,
        created_at=record.created_at,
    )


@router.get("/forms/{form_type}", response_model=list[FormSubmissionRead])
def list_form_submissions(form_type: str, session: Session = Depends(get_session)):
    statement = (
        select(FormSubmission)
        .where(FormSubmission.form_type == form_type)
        .order_by(FormSubmission.created_at.desc())
    )
    records = session.exec(statement).all()

    return [
        FormSubmissionRead(
            id=record.id,
            form_type=record.form_type,
            payload=record.payload,
            created_at=record.created_at,
        )
        for record in records
    ]


@router.get("/forms/overview/all", response_model=list[OverviewItem])
def overview_forms(session: Session = Depends(get_session)):
    statement = select(FormSubmission).order_by(FormSubmission.created_at.desc())
    records = session.exec(statement).all()

    overview: list[OverviewItem] = []

    for record in records:
        fields: dict[str, Any] = record.payload.get("fields", {})
        title = (
            fields.get("cargo_no")
            or fields.get("po_no")
            or fields.get("container_no")
            or f"Submission {record.id}"
        )
        overview.append(
            OverviewItem(
                id=record.id,
                form_type=record.form_type,
                created_at=record.created_at,
                title=str(title),
            )
        )

    return overview
