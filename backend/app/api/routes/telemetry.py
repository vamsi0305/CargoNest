import logging

from fastapi import APIRouter, Request, status

from app.core.config import settings
from app.core.logging import get_logger, log_structured
from app.schemas.monitoring import FrontendErrorReport

router = APIRouter(tags=['telemetry'])
logger = get_logger('cargonest.telemetry')


@router.post('/telemetry/frontend-errors', status_code=status.HTTP_202_ACCEPTED)
def record_frontend_error(payload: FrontendErrorReport, request: Request) -> dict[str, bool]:
    if not settings.frontend_error_reporting_enabled:
        return {'accepted': False}

    request_id = getattr(request.state, 'request_id', 'unknown')
    log_structured(
        logger,
        logging.ERROR,
        'frontend_error_reported',
        request_id=request_id,
        source=payload.source,
        severity=payload.severity,
        message=payload.message,
        url=payload.url,
        user_agent=payload.user_agent,
        stack=payload.stack,
        component_stack=payload.component_stack,
    )
    return {'accepted': True}
