from collections import defaultdict
from datetime import date, datetime
from typing import Any

from sqlmodel import Session, select

from app.models.form_submission import FormSubmission
from app.schemas.purchase_order import (
    PurchaseOrderListResponse,
    PurchaseOrderMetrics,
    PurchaseOrderRead,
)

PURCHASE_ORDER_FORM = 'purchase_order'
PROCESSING_FORMS = {'stock_reglazing', 'stock_repacking', 'stock_sampling'}
INSPECTION_FORMS = {'stock_inspection', 'stock_pht'}
SHIPMENT_FORMS = {'shipment'}
LOGISTICS_FORMS = {'vehicle_details'}
TRACKED_FORMS = {PURCHASE_ORDER_FORM, *PROCESSING_FORMS, *INSPECTION_FORMS, *SHIPMENT_FORMS, *LOGISTICS_FORMS}


def _payload_fields(record: FormSubmission | None) -> dict[str, Any]:
    if record is None:
        return {}
    fields = record.payload.get('fields', {})
    return fields if isinstance(fields, dict) else {}


def _payload_extra(record: FormSubmission | None) -> dict[str, Any]:
    if record is None:
        return {}
    extra = record.payload.get('extra', {})
    return extra if isinstance(extra, dict) else {}


def _clean_text(value: Any) -> str:
    return str(value or '').strip()


def _parse_date(value: Any, fallback: date) -> date:
    raw = _clean_text(value)
    if not raw:
        return fallback

    for pattern in ('%d-%m-%Y', '%Y-%m-%d', '%d/%m/%Y'):
        try:
            return datetime.strptime(raw, pattern).date()
        except ValueError:
            continue

    return fallback


def _parse_float(value: Any) -> float:
    raw = _clean_text(value)
    if not raw:
        return 0.0

    sanitized = raw.replace(',', '')
    try:
        return float(sanitized)
    except ValueError:
        return 0.0


def _latest_record(existing: FormSubmission | None, candidate: FormSubmission) -> FormSubmission:
    if existing is None:
        return candidate

    if candidate.created_at > existing.created_at:
        return candidate

    if candidate.created_at == existing.created_at and (candidate.id or 0) > (existing.id or 0):
        return candidate

    return existing


def _build_form_index(session: Session) -> dict[str, dict[str, FormSubmission]]:
    records = session.exec(
        select(FormSubmission)
        .where(FormSubmission.form_type.in_(TRACKED_FORMS))
        .order_by(FormSubmission.created_at.desc(), FormSubmission.id.desc())
    ).all()
    indexed: dict[str, dict[str, FormSubmission]] = defaultdict(dict)

    for record in records:
        cargo_no = _clean_text(_payload_fields(record).get('cargo_no'))
        if not cargo_no:
            continue
        current = indexed[cargo_no].get(record.form_type)
        indexed[cargo_no][record.form_type] = _latest_record(current, record)

    return indexed


def _resolve_status(forms_by_type: dict[str, FormSubmission]) -> tuple[str, int]:
    if forms_by_type.keys() & SHIPMENT_FORMS:
        return 'shipment_ready', 100

    if forms_by_type.keys() & INSPECTION_FORMS:
        return 'inspection', 75

    if forms_by_type.keys() & PROCESSING_FORMS:
        return 'processing', 50

    return 'draft', 25


def _resolve_quantity_kg(po_record: FormSubmission) -> float:
    extra = _payload_extra(po_record)
    rows = extra.get('product_rows', [])
    if not isinstance(rows, list):
        return 0.0

    return round(
        sum(_parse_float(row.get('qty_in_kg')) for row in rows if isinstance(row, dict)),
        2,
    )


def _build_purchase_order_read(po_record: FormSubmission, forms_by_type: dict[str, FormSubmission]) -> PurchaseOrderRead:
    fields = _payload_fields(po_record)
    shipment_fields = _payload_fields(forms_by_type.get('shipment'))
    status, progress = _resolve_status(forms_by_type)
    fallback_date = po_record.created_at.date()

    shipment_target = (
        _clean_text(shipment_fields.get('eta_date'))
        or _clean_text(fields.get('final_destination'))
        or _clean_text(fields.get('pod'))
        or _clean_text(fields.get('country'))
        or 'TBD'
    )

    return PurchaseOrderRead(
        id=str(po_record.id or ''),
        cargo_no=_clean_text(fields.get('cargo_no')) or f'PO-{po_record.id}',
        po_no=_clean_text(fields.get('po_no')) or 'TBD',
        buyer=_clean_text(fields.get('buyer')) or 'Unknown buyer',
        agent_name=_clean_text(fields.get('agent')) or 'Unknown agent',
        destination=_clean_text(fields.get('final_destination'))
        or _clean_text(fields.get('pod'))
        or _clean_text(fields.get('country'))
        or 'TBD',
        po_date=_parse_date(fields.get('po_date'), fallback_date),
        status=status,
        progress=progress,
        total_quantity_kg=_resolve_quantity_kg(po_record),
        shipment_target=shipment_target,
    )


def list_purchase_orders(session: Session) -> PurchaseOrderListResponse:
    purchase_order_records = session.exec(
        select(FormSubmission)
        .where(FormSubmission.form_type == PURCHASE_ORDER_FORM)
        .order_by(FormSubmission.created_at.desc(), FormSubmission.id.desc())
    ).all()
    indexed_forms = _build_form_index(session)

    items = [
        _build_purchase_order_read(
            record,
            indexed_forms.get(_clean_text(_payload_fields(record).get('cargo_no')), {}),
        )
        for record in purchase_order_records
    ]

    pending_shipments = sum(1 for item in items if item.status != 'shipment_ready')
    quality_checks_due = sum(1 for item in items if item.status in {'draft', 'processing'})
    cold_chain_alerts = sum(
        1
        for item in items
        if indexed_forms.get(item.cargo_no, {}).keys() & SHIPMENT_FORMS
        and not indexed_forms.get(item.cargo_no, {}).keys() & LOGISTICS_FORMS
    )

    return PurchaseOrderListResponse(
        items=items,
        metrics=PurchaseOrderMetrics(
            active_orders=len(items),
            pending_shipments=pending_shipments,
            quality_checks_due=quality_checks_due,
            cold_chain_alerts=cold_chain_alerts,
        ),
        source='form_submissions',
    )


def get_purchase_order(session: Session, order_id: str) -> PurchaseOrderRead | None:
    record = session.get(FormSubmission, int(order_id)) if order_id.isdigit() else None
    if record is None or record.form_type != PURCHASE_ORDER_FORM:
        return None

    indexed_forms = _build_form_index(session)
    cargo_no = _clean_text(_payload_fields(record).get('cargo_no'))
    return _build_purchase_order_read(record, indexed_forms.get(cargo_no, {}))
