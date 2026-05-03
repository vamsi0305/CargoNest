from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

engine_kwargs: dict = {'echo': False}
if settings.database_url.startswith('sqlite'):
    engine_kwargs['connect_args'] = {'check_same_thread': False}

engine = create_engine(settings.database_url, **engine_kwargs)


def import_model_metadata() -> None:
    from app import models  # noqa: F401


def create_db_and_tables() -> None:
    import_model_metadata()
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
