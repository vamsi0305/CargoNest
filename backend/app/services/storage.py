import mimetypes
import re
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from storage3.utils import StorageException
from supabase import Client, create_client

from app.core.config import settings

UPLOAD_DIR = Path('uploads')
UPLOAD_DIR.mkdir(exist_ok=True)
SAFE_FILENAME_PATTERN = re.compile(r'[^A-Za-z0-9._-]+')
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_UPLOAD_EXTENSIONS = {
    '.pdf',
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
}


def _sanitize_filename(filename: str) -> str:
    cleaned = SAFE_FILENAME_PATTERN.sub('_', Path(filename).name).strip('._')
    return cleaned or 'attachment'


def _build_storage_path(filename: str) -> str:
    folder = settings.supabase_storage_folder.strip().strip('/')
    safe_name = _sanitize_filename(filename)
    unique_name = f'{uuid4()}_{safe_name}'
    return f'{folder}/{unique_name}' if folder else unique_name


def _get_storage_client() -> Client:
    if not settings.storage_enabled:
        raise RuntimeError('Supabase Storage is not configured.')
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def upload_attachment(file: UploadFile) -> tuple[str, str]:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='No file selected.')

    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Unsupported file type. Allowed files: PDF, image, Word, and Excel formats.',
        )

    content = file.file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Uploaded file is empty.')
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Uploaded file exceeds the 10 MB size limit.',
        )

    if settings.storage_enabled:
        storage_path = _build_storage_path(file.filename)
        content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
        client = _get_storage_client()

        try:
            client.storage.from_(settings.supabase_storage_bucket).upload(
                path=storage_path,
                file=content,
                file_options={
                    'content-type': content_type,
                    'cache-control': '3600',
                    'upsert': 'false',
                },
            )
            public_url = client.storage.from_(settings.supabase_storage_bucket).get_public_url(storage_path)
            return storage_path, public_url
        except StorageException as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f'Supabase Storage upload failed: {exc}',
            ) from exc
        except Exception as exc:  # pragma: no cover - safety net for transport/client errors
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail='Supabase Storage is unavailable. Please verify storage configuration.',
            ) from exc

    if settings.app_env != 'development':
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Storage is not configured for production uploads.',
        )

    stored_name = f'{uuid4()}_{_sanitize_filename(file.filename)}'
    target = UPLOAD_DIR / stored_name
    target.write_bytes(content)
    return stored_name, f'/uploads/{stored_name}'
