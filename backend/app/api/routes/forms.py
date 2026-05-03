from typing import Any

from fastapi import APIRouter, Depends, File, UploadFile
from sqlmodel import Session, select

from app.api.deps.auth import get_current_user, require_csrf_token
from app.core.database import get_session
from app.models.form_submission import FormSubmission
from app.models.user_account import UserAccount
from app.schemas.forms import (
    FileUploadResponse,
    FormPrefillResponse,
    FormSubmissionCreate,
    FormSubmissionRead,
    OverviewItem,
)
from app.services.auth import get_role_map, require_form_access
from app.services.form_validation import validate_form_payload
from app.services.storage import upload_attachment

router = APIRouter(tags=['forms'])

FORM_TABLE_KEYS = {
    'purchase_order': 'product_rows',
    'stock_reglazing': 'reglazing_rows',
    'stock_repacking': 'repacking_rows',
    'stock_pht': 'pht_rows',
}

PO_TO_FORM_FIELD_MAP: dict[str, dict[str, str]] = {
    'stock_reglazing': {'buyer': 'buyer_name'},
    'stock_repacking': {'buyer': 'buyer_name'},
    'stock_sampling': {'buyer': 'buyer_name'},
    'stock_inspection': {'buyer': 'buyer_name'},
}

SHARED_TABLE_FIELDS = [
    'brand',
    'product',
    'packing',
    'glaze',
    'grade',
    'no_of_mc',
    'qty_in_kg',
    'price',
]

DEMO_SIGNATURES: dict[str, dict[str, str]] = {
    'purchase_order': {'cargo_no': 'CGN-24091', 'po_no': 'PO-8751', 'buyer': 'BlueWave Imports'},
    'stock_reglazing': {'cargo_no': 'CGN-24091', 'po_no': 'PO-8751', 'plant': 'Plant 1'},
    'stock_repacking': {'cargo_no': 'CGN-24091', 'po_no': 'PO-8751'},
    'stock_sampling': {'lab_name': 'MarineLab Chennai', 'sample_send_date': '20-03-2026'},
    'stock_inspection': {'inspection': 'SGS', 'inspection_status': 'Pass'},
    'stock_pht': {'cargo_no': 'CGN-24091'},
    'shipment': {'cargo_no': 'CGN-24091', 'container_no': 'MSCU3928104'},
    'vehicle_details': {'reference_id': 'VEH-98341', 'vehicle_no': 'TN-22-AQ-7712'},
}


def get_payload_fields(payload: dict[str, Any]) -> dict[str, Any]:
    fields = payload.get('fields', {})
    return fields if isinstance(fields, dict) else {}


def get_payload_extra(payload: dict[str, Any]) -> dict[str, Any]:
    extra = payload.get('extra', {})
    return extra if isinstance(extra, dict) else {}


def get_form_records(session: Session, form_type: str) -> list[FormSubmission]:
    statement = (
        select(FormSubmission)
        .where(FormSubmission.form_type == form_type)
        .order_by(FormSubmission.created_at.desc(), FormSubmission.id.desc())
    )
    return list(session.exec(statement).all())


def find_latest_form_record(
    session: Session, form_type: str, cargo_no: str | None
) -> FormSubmission | None:
    if not cargo_no:
        return None

    for record in get_form_records(session, form_type):
        record_cargo = str(get_payload_fields(record.payload).get('cargo_no', '')).strip()
        if record_cargo == cargo_no:
            return record

    return None


def matches_demo_signature(record: FormSubmission) -> bool:
    signature = DEMO_SIGNATURES.get(record.form_type)
    if not signature:
        return False

    fields = get_payload_fields(record.payload)
    extra = get_payload_extra(record.payload)
    return (not extra) and all(
        str(fields.get(key, '')).strip() == value for key, value in signature.items()
    )


def purge_legacy_demo_submissions(session: Session) -> None:
    records = session.exec(select(FormSubmission)).all()
    deleted_any = False

    for record in records:
        if matches_demo_signature(record):
            session.delete(record)
            deleted_any = True

    if deleted_any:
        session.commit()


def merge_po_fields(form_type: str, po_fields: dict[str, Any], form_fields: dict[str, Any]) -> dict[str, Any]:
    merged = dict(po_fields)

    for source_key, target_key in PO_TO_FORM_FIELD_MAP.get(form_type, {}).items():
        if po_fields.get(source_key):
            merged[target_key] = po_fields[source_key]

    for key, value in form_fields.items():
        if isinstance(value, str):
            if value.strip():
                merged[key] = value
        elif value is not None:
            merged[key] = value

    return merged


def merge_shared_rows(
    po_rows: list[dict[str, Any]],
    target_rows: list[dict[str, Any]],
    editable_fields: set[str],
) -> list[dict[str, Any]]:
    row_count = max(len(po_rows), len(target_rows))
    merged_rows: list[dict[str, Any]] = []

    for index in range(row_count):
        po_row = po_rows[index] if index < len(po_rows) else {}
        target_row = target_rows[index] if index < len(target_rows) else {}
        row: dict[str, Any] = {}

        for key in SHARED_TABLE_FIELDS:
            row[key] = po_row.get(key, target_row.get(key, ''))

        for key, value in po_row.items():
            row.setdefault(key, value)

        for key, value in target_row.items():
            if key in editable_fields or key not in SHARED_TABLE_FIELDS:
                row[key] = value

        merged_rows.append(row)

    return merged_rows


def merge_payload(existing_payload: dict[str, Any], incoming_payload: dict[str, Any]) -> dict[str, Any]:
    existing_fields = get_payload_fields(existing_payload)
    incoming_fields = get_payload_fields(incoming_payload)
    existing_extra = get_payload_extra(existing_payload)
    incoming_extra = get_payload_extra(incoming_payload)

    return {
        'fields': {**existing_fields, **incoming_fields},
        'extra': {**existing_extra, **incoming_extra},
    }


def build_prefill_payload(
    form_type: str, po_payload: dict[str, Any] | None, form_payload: dict[str, Any] | None
) -> FormPrefillResponse:
    po_fields = get_payload_fields(po_payload or {})
    po_extra = get_payload_extra(po_payload or {})
    form_fields = get_payload_fields(form_payload or {})
    form_extra = get_payload_extra(form_payload or {})

    merged_fields = merge_po_fields(form_type, po_fields, form_fields)
    merged_extra = dict(form_extra)

    target_table_key = FORM_TABLE_KEYS.get(form_type)
    po_table_key = FORM_TABLE_KEYS.get('purchase_order')

    if target_table_key and po_table_key:
        po_rows = po_extra.get(po_table_key, [])
        target_rows = form_extra.get(target_table_key, [])

        if isinstance(po_rows, list) and isinstance(target_rows, list):
            editable_fields = {
                key
                for row in target_rows
                if isinstance(row, dict)
                for key in row.keys()
                if key not in SHARED_TABLE_FIELDS
            }
            merged_extra[target_table_key] = merge_shared_rows(
                [row for row in po_rows if isinstance(row, dict)],
                [row for row in target_rows if isinstance(row, dict)],
                editable_fields,
            )
        elif isinstance(po_rows, list):
            merged_extra[target_table_key] = [
                {key: row.get(key, '') for key in row.keys()}
                for row in po_rows
                if isinstance(row, dict)
            ]

    return FormPrefillResponse(fields=merged_fields, extra=merged_extra)


def ensure_user_can_access(
    current_user: UserAccount,
    session: Session,
    access_key: str,
) -> None:
    role_map = get_role_map(session)
    require_form_access(current_user, role_map, access_key)


@router.post('/uploads', response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: UserAccount = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
):
    stored_name, file_url = upload_attachment(file)

    return FileUploadResponse(
        file_name=file.filename or stored_name,
        stored_name=stored_name,
        file_url=file_url,
    )


@router.post('/forms/{form_type}', response_model=FormSubmissionRead)
def save_form_submission(
    form_type: str,
    payload: FormSubmissionCreate,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
):
    ensure_user_can_access(current_user, session, form_type)
    validate_form_payload(form_type, payload.payload)
    fields = get_payload_fields(payload.payload)
    cargo_no = str(fields.get('cargo_no', '')).strip() or None
    record = find_latest_form_record(session, form_type, cargo_no)

    if record is None:
        record = FormSubmission(form_type=form_type, payload=payload.payload)
        session.add(record)
    else:
        record.payload = merge_payload(record.payload, payload.payload)

    session.commit()
    session.refresh(record)

    return FormSubmissionRead(
        id=record.id,
        form_type=record.form_type,
        payload=record.payload,
        created_at=record.created_at,
    )


@router.get('/forms/{form_type}', response_model=list[FormSubmissionRead])
def list_form_submissions(
    form_type: str,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    ensure_user_can_access(current_user, session, form_type)
    records = get_form_records(session, form_type)

    return [
        FormSubmissionRead(
            id=record.id,
            form_type=record.form_type,
            payload=record.payload,
            created_at=record.created_at,
        )
        for record in records
    ]


@router.get('/forms/prefill/{form_type}/{cargo_no}', response_model=FormPrefillResponse)
def get_form_prefill(
    form_type: str,
    cargo_no: str,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    ensure_user_can_access(current_user, session, form_type)
    cleaned_cargo = cargo_no.strip()
    if not cleaned_cargo:
        return FormPrefillResponse(fields={}, extra={})

    po_record = find_latest_form_record(session, 'purchase_order', cleaned_cargo)
    form_record = find_latest_form_record(session, form_type, cleaned_cargo)

    return build_prefill_payload(
        form_type=form_type,
        po_payload=po_record.payload if po_record else None,
        form_payload=form_record.payload if form_record else None,
    )


@router.get('/forms/overview/all', response_model=list[OverviewItem])
def overview_forms(
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    ensure_user_can_access(current_user, session, 'overview')
    statement = select(FormSubmission).order_by(FormSubmission.created_at.desc())
    records = session.exec(statement).all()

    role_map = get_role_map(session)
    accessible_forms = set(current_user.allowed_forms)
    if 'admin' in {role.name for role in role_map.values() if role.id == current_user.role_id}:
        accessible_forms = {record.form_type for record in records}

    overview: list[OverviewItem] = []

    for record in records:
        if record.form_type not in accessible_forms:
            continue
        fields: dict[str, Any] = record.payload.get('fields', {})
        title = (
            fields.get('cargo_no')
            or fields.get('po_no')
            or fields.get('container_no')
            or f'Submission {record.id}'
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
