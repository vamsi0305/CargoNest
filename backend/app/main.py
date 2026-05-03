import logging
import time
from uuid import uuid4

from fastapi import FastAPI
from fastapi import HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session

from app.api.routes.auth import router as auth_router
from app.api.routes.forms import purge_legacy_demo_submissions
from app.api.routes.forms import router as forms_router
from app.api.routes.health import router as health_router
from app.api.routes.purchase_orders import router as purchase_orders_router
from app.api.routes.telemetry import router as telemetry_router
from app.core.config import settings
from app.core.database import create_db_and_tables, engine, import_model_metadata
from app.core.logging import configure_logging, get_logger, log_structured
from app.services.auth import ensure_bootstrap_admin
from app.services.storage import UPLOAD_DIR

configure_logging()
logger = get_logger('cargonest.api')

app = FastAPI(
    title=settings.app_name,
    version='0.1.0',
    description='API for CargoNest export operations.',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_frontend_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

if settings.app_env == 'development':
    app.mount('/uploads', StaticFiles(directory=str(UPLOAD_DIR)), name='uploads')


def validate_runtime_settings() -> None:
    if settings.app_env == 'production' and settings.session_secret_key == 'development-session-secret':
        raise RuntimeError('SESSION_SECRET_KEY must be set to a strong non-default value in production.')


@app.middleware('http')
async def request_logging_middleware(request: Request, call_next):
    request_id = uuid4().hex
    request.state.request_id = request_id
    started = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - started) * 1000, 2)
        log_structured(
            logger,
            logging.ERROR,
            'request_unhandled_exception',
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            query=str(request.url.query),
            duration_ms=duration_ms,
            client=request.client.host if request.client else 'unknown',
        )
        raise

    duration_ms = round((time.perf_counter() - started) * 1000, 2)
    response.headers['X-Request-ID'] = request_id
    level = logging.WARNING if response.status_code >= 400 else logging.INFO
    log_structured(
        logger,
        level,
        'request_completed',
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        query=str(request.url.query),
        status_code=response.status_code,
        duration_ms=duration_ms,
        client=request.client.host if request.client else 'unknown',
    )
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, 'request_id', uuid4().hex)
    log_structured(
        logger,
        logging.WARNING if exc.status_code < 500 else logging.ERROR,
        'http_exception',
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        status_code=exc.status_code,
        detail=exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={'detail': exc.detail, 'request_id': request_id},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, 'request_id', uuid4().hex)
    log_structured(
        logger,
        logging.ERROR,
        'unhandled_exception',
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        error_type=type(exc).__name__,
        message=str(exc),
    )
    return JSONResponse(
        status_code=500,
        content={'detail': 'Internal server error.', 'request_id': request_id},
    )


@app.on_event('startup')
def on_startup() -> None:
    validate_runtime_settings()
    import_model_metadata()
    if settings.auto_create_tables:
        create_db_and_tables()
    with Session(engine) as session:
        purge_legacy_demo_submissions(session)
        ensure_bootstrap_admin(session)
    log_structured(logger, logging.INFO, 'application_started', environment=settings.app_env)


app.include_router(health_router, prefix='/api/v1')
app.include_router(auth_router, prefix='/api/v1')
app.include_router(purchase_orders_router, prefix='/api/v1')
app.include_router(forms_router, prefix='/api/v1')
app.include_router(telemetry_router, prefix='/api/v1')


@app.get('/')
def root() -> dict[str, str]:
    return {'message': 'CargoNest API is running.'}
