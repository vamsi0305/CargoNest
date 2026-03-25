from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session

from app.api.routes.forms import router as forms_router
from app.api.routes.forms import seed_sample_submissions
from app.api.routes.health import router as health_router
from app.api.routes.purchase_orders import router as purchase_orders_router
from app.core.config import settings
from app.core.database import create_db_and_tables, engine

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API for CargoNest export operations.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()
    with Session(engine) as session:
        seed_sample_submissions(session)


app.include_router(health_router, prefix="/api/v1")
app.include_router(purchase_orders_router, prefix="/api/v1")
app.include_router(forms_router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "CargoNest API is running."}
