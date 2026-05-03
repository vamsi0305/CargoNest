import re
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

from fastapi import HTTPException, status


DATE_PATTERN = re.compile(r'^\d{2}-\d{2}-\d{4}$')
TIME_PATTERN = re.compile(r'^\d{2}:\d{2}$')
NUMERIC_PATTERN = re.compile(r'^-?\d+(?:\.\d+)?$')
INTEGER_PATTERN = re.compile(r'^\d+$')
PHONE_PATTERN = re.compile(r'^[0-9+()\-\s]{7,20}$')

MAX_FIELD_LENGTH = 500
MAX_TEXTAREA_LENGTH = 2_000
MAX_ATTACHMENT_LENGTH = 2_048
MAX_TABLE_CELL_LENGTH = 255


@dataclass(frozen=True)
class FormSchema:
    allowed_fields: set[str]
    required_fields: set[str]
    date_fields: set[str]
    time_fields: set[str]
    numeric_fields: set[str]
    integer_fields: set[str]
    attachment_fields: set[str]
    long_text_fields: set[str]
    phone_fields: set[str]
    table_key: str | None = None
    table_columns: set[str] | None = None


FORM_SCHEMAS: dict[str, FormSchema] = {
    'purchase_order': FormSchema(
        allowed_fields={
            'cargo_no',
            'plant',
            'year',
            'buyer',
            'agent',
            'invoice_no',
            'po_no',
            'pi_date',
            'pi_no',
            'po_date',
            'po_received',
            'po_validity',
            'payment_mode',
            'payment_term',
            'pod_term',
            'pod',
            'country',
            'region',
            'final_destination',
            'other_info',
            'region_notes',
        },
        required_fields={
            'cargo_no',
            'plant',
            'year',
            'buyer',
            'agent',
            'invoice_no',
            'po_no',
            'pi_date',
            'pi_no',
            'po_date',
            'po_received',
            'po_validity',
            'payment_mode',
            'payment_term',
            'pod_term',
            'pod',
            'country',
            'region',
            'final_destination',
            'other_info',
            'region_notes',
        },
        date_fields={'pi_date', 'po_date'},
        time_fields=set(),
        numeric_fields=set(),
        integer_fields=set(),
        attachment_fields=set(),
        long_text_fields={'other_info', 'region_notes'},
        phone_fields=set(),
        table_key='product_rows',
        table_columns={'brand', 'product', 'packing', 'glaze', 'grade', 'no_of_mc', 'qty_in_kg', 'price'},
    ),
    'stock_reglazing': FormSchema(
        allowed_fields={'cargo_no', 'po_no', 'invoice_no', 'plant', 'buyer_name', 'assortment'},
        required_fields={'cargo_no', 'po_no', 'invoice_no', 'plant', 'buyer_name', 'assortment'},
        date_fields=set(),
        time_fields=set(),
        numeric_fields=set(),
        integer_fields=set(),
        attachment_fields=set(),
        long_text_fields=set(),
        phone_fields=set(),
        table_key='reglazing_rows',
        table_columns={
            'brand',
            'product',
            'packing',
            'glaze',
            'grade',
            'no_of_mc',
            'qty_in_kg',
            'price',
            'reglazing_in_qty',
            'reglazing_done',
            'reglazing_balance',
            'location_1_qty',
            'location_2_qty',
        },
    ),
    'stock_repacking': FormSchema(
        allowed_fields={'cargo_no', 'po_no', 'invoice_no', 'plant', 'buyer_name', 'assortment'},
        required_fields={'cargo_no', 'po_no', 'invoice_no', 'plant', 'buyer_name', 'assortment'},
        date_fields=set(),
        time_fields=set(),
        numeric_fields=set(),
        integer_fields=set(),
        attachment_fields=set(),
        long_text_fields=set(),
        phone_fields=set(),
        table_key='repacking_rows',
        table_columns={
            'brand',
            'product',
            'packing',
            'glaze',
            'grade',
            'no_of_mc',
            'qty_in_kg',
            'price',
            'repacking',
            'repacking_done',
            'repacking_balance',
            'stock_location_repacked',
            'repacked_at',
        },
    ),
    'stock_sampling': FormSchema(
        allowed_fields={
            'cargo_no',
            'po_no',
            'invoice_no',
            'plant',
            'buyer_name',
            'lab_name',
            'sample_send_date',
            'report_received_date',
            'no_of_days',
        },
        required_fields={
            'cargo_no',
            'po_no',
            'invoice_no',
            'plant',
            'buyer_name',
            'lab_name',
            'sample_send_date',
            'report_received_date',
            'no_of_days',
        },
        date_fields={'sample_send_date', 'report_received_date'},
        time_fields=set(),
        numeric_fields=set(),
        integer_fields={'no_of_days'},
        attachment_fields=set(),
        long_text_fields=set(),
        phone_fields=set(),
    ),
    'stock_inspection': FormSchema(
        allowed_fields={
            'cargo_no',
            'po_no',
            'invoice_no',
            'plant',
            'buyer_name',
            'inspection',
            'date_of_inspection',
            'inspection_status',
        },
        required_fields={
            'cargo_no',
            'po_no',
            'invoice_no',
            'plant',
            'buyer_name',
            'inspection',
            'date_of_inspection',
            'inspection_status',
        },
        date_fields={'date_of_inspection'},
        time_fields=set(),
        numeric_fields=set(),
        integer_fields=set(),
        attachment_fields=set(),
        long_text_fields=set(),
        phone_fields=set(),
    ),
    'stock_pht': FormSchema(
        allowed_fields={'cargo_no', 'po_no', 'invoice_no', 'type_of_pht_file'},
        required_fields={'cargo_no', 'po_no', 'invoice_no', 'type_of_pht_file'},
        date_fields=set(),
        time_fields=set(),
        numeric_fields=set(),
        integer_fields=set(),
        attachment_fields={'type_of_pht_file'},
        long_text_fields=set(),
        phone_fields=set(),
        table_key='pht_rows',
        table_columns={
            'brand',
            'product',
            'packing',
            'glaze',
            'grade',
            'no_of_mc',
            'qty_in_kg',
            'price',
            'type_of_pht',
            'if_bap',
            'qty_rm',
            'pht_no',
        },
    ),
    'shipment': FormSchema(
        allowed_fields={
            'cargo_no',
            'po_no',
            'invoice_no',
            'temp',
            'reefer',
            'ocean_freight_vendor',
            'cnf',
            'ocean_freight',
            'liner',
            'booking_no',
            'container_no',
            'transporter',
            'trailer_no',
            'pickup_date',
            'picked_in',
            'container_date',
            'stuffed_at',
            'stuffing_date',
            'offloaded_at',
            'container_out_date',
            'eta_date',
            'container_offloaded_at',
            'container_picked_at',
            'bl_date',
            'bl_month',
            'liner_seal',
            'e_seal_no',
            'bl_no',
            'status',
        },
        required_fields={
            'cargo_no',
            'po_no',
            'invoice_no',
            'temp',
            'reefer',
            'ocean_freight_vendor',
            'cnf',
            'ocean_freight',
            'liner',
            'booking_no',
            'container_no',
            'transporter',
            'trailer_no',
            'pickup_date',
            'picked_in',
            'container_date',
            'stuffed_at',
            'stuffing_date',
            'offloaded_at',
            'container_out_date',
            'eta_date',
            'container_offloaded_at',
            'container_picked_at',
            'bl_date',
            'bl_month',
            'liner_seal',
            'e_seal_no',
            'bl_no',
            'status',
        },
        date_fields={'pickup_date', 'container_date', 'stuffing_date', 'container_out_date', 'eta_date', 'bl_date'},
        time_fields=set(),
        numeric_fields=set(),
        integer_fields=set(),
        attachment_fields=set(),
        long_text_fields=set(),
        phone_fields=set(),
    ),
    'vehicle_details': FormSchema(
        allowed_fields={
            'cargo_no',
            'po_no',
            'invoice_no',
            'reference_id',
            'empty_or_load',
            'movement_type',
            'container_no',
            'transporter',
            'driver_contact_number',
            'vehicle_no',
            'gri_attachment',
            'from_location',
            'gri_date',
            'to_location',
            'qty_in_kg',
            'gatepass_attachment',
            'stuffing_sheet_attachment',
            'vehicle_out_temperature',
            'vehicle_in_temperature',
            'out_time',
            'in_time',
            'other_info',
        },
        required_fields={
            'cargo_no',
            'po_no',
            'invoice_no',
            'reference_id',
            'empty_or_load',
            'movement_type',
            'container_no',
            'transporter',
            'driver_contact_number',
            'vehicle_no',
            'gri_attachment',
            'from_location',
            'gri_date',
            'to_location',
            'qty_in_kg',
            'gatepass_attachment',
            'stuffing_sheet_attachment',
            'vehicle_out_temperature',
            'vehicle_in_temperature',
            'out_time',
            'other_info',
        },
        date_fields={'gri_date'},
        time_fields={'out_time', 'in_time'},
        numeric_fields={'qty_in_kg'},
        integer_fields=set(),
        attachment_fields={'gri_attachment', 'gatepass_attachment', 'stuffing_sheet_attachment'},
        long_text_fields={'other_info'},
        phone_fields={'driver_contact_number'},
    ),
}


def _raise_validation(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=detail)


def _require_string(value: Any, field_name: str, max_length: int) -> str:
    if not isinstance(value, str):
        _raise_validation(f'{field_name} must be a string.')

    cleaned = value.strip()
    if not cleaned:
        _raise_validation(f'{field_name} is required.')
    if len(cleaned) > max_length:
        _raise_validation(f'{field_name} exceeds the maximum length of {max_length} characters.')
    return cleaned


def _validate_attachment(value: str, field_name: str) -> None:
    if len(value) > MAX_ATTACHMENT_LENGTH:
        _raise_validation(f'{field_name} exceeds the maximum URL length.')

    if value.startswith('/uploads/'):
        return

    parsed = urlparse(value)
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc:
        _raise_validation(f'{field_name} must contain a valid uploaded file URL.')


def _validate_scalar_field(field_name: str, value: Any, schema: FormSchema) -> None:
    max_length = MAX_TEXTAREA_LENGTH if field_name in schema.long_text_fields else MAX_FIELD_LENGTH
    cleaned = _require_string(value, field_name, max_length)

    if field_name in schema.date_fields and not DATE_PATTERN.fullmatch(cleaned):
        _raise_validation(f'{field_name} must use DD-MM-YYYY format.')
    if field_name in schema.time_fields and not TIME_PATTERN.fullmatch(cleaned):
        _raise_validation(f'{field_name} must use HH:MM format.')
    if field_name in schema.numeric_fields and not NUMERIC_PATTERN.fullmatch(cleaned):
        _raise_validation(f'{field_name} must be numeric.')
    if field_name in schema.integer_fields and not INTEGER_PATTERN.fullmatch(cleaned):
        _raise_validation(f'{field_name} must be a whole number.')
    if field_name in schema.phone_fields and not PHONE_PATTERN.fullmatch(cleaned):
        _raise_validation(f'{field_name} must contain a valid phone number.')
    if field_name in schema.attachment_fields:
        _validate_attachment(cleaned, field_name)


def _validate_fields(form_type: str, fields: dict[str, Any], schema: FormSchema) -> None:
    unknown_fields = sorted(set(fields.keys()) - schema.allowed_fields)
    if unknown_fields:
        _raise_validation(f'Unsupported fields for {form_type}: {", ".join(unknown_fields)}.')

    missing_fields = sorted(
        field_name for field_name in schema.required_fields if not isinstance(fields.get(field_name), str) or not fields[field_name].strip()
    )
    if missing_fields:
        _raise_validation(f'Missing required fields for {form_type}: {", ".join(missing_fields)}.')

    for field_name, value in fields.items():
        if isinstance(value, list):
            if not value:
                _raise_validation(f'{field_name} must not be empty.')
            for item in value:
                _validate_scalar_field(field_name, item, schema)
            continue

        _validate_scalar_field(field_name, value, schema)


def _validate_extra(form_type: str, extra: dict[str, Any], schema: FormSchema) -> None:
    if schema.table_key is None:
        if extra:
            _raise_validation(f'{form_type} does not accept extra payload data.')
        return

    if set(extra.keys()) != {schema.table_key}:
        _raise_validation(f'{form_type} must include only the {schema.table_key} table payload.')

    rows = extra.get(schema.table_key)
    if not isinstance(rows, list) or not rows:
        _raise_validation(f'{schema.table_key} must contain at least one row.')

    assert schema.table_columns is not None

    for index, row in enumerate(rows, start=1):
        if not isinstance(row, dict):
            _raise_validation(f'{schema.table_key} row {index} must be an object.')

        unknown_columns = sorted(set(row.keys()) - schema.table_columns)
        if unknown_columns:
            _raise_validation(
                f'{schema.table_key} row {index} includes unsupported columns: {", ".join(unknown_columns)}.'
            )

        missing_columns = sorted(column for column in schema.table_columns if not str(row.get(column, '')).strip())
        if missing_columns:
            _raise_validation(
                f'{schema.table_key} row {index} is missing required values: {", ".join(missing_columns)}.'
            )

        for column, value in row.items():
            cleaned = _require_string(value, f'{schema.table_key}.{column}', MAX_TABLE_CELL_LENGTH)
            if column in {'qty_in_kg', 'price', 'qty_rm'} and not NUMERIC_PATTERN.fullmatch(cleaned):
                _raise_validation(f'{schema.table_key}.{column} row {index} must be numeric.')


def validate_form_payload(form_type: str, payload: dict[str, Any]) -> None:
    schema = FORM_SCHEMAS.get(form_type)
    if schema is None:
        _raise_validation(f'Unsupported form type: {form_type}.')

    fields = payload.get('fields', {})
    extra = payload.get('extra', {})

    if not isinstance(fields, dict):
        _raise_validation('fields payload must be an object.')
    if not isinstance(extra, dict):
        _raise_validation('extra payload must be an object.')

    _validate_fields(form_type, fields, schema)
    _validate_extra(form_type, extra, schema)
