import json
import logging
from typing import Any

from app.core.config import settings


def configure_logging() -> None:
    root_logger = logging.getLogger()
    if root_logger.handlers:
        root_logger.setLevel(settings.log_level.upper())
        return

    logging.basicConfig(
        level=settings.log_level.upper(),
        format='%(asctime)s %(levelname)s %(name)s %(message)s',
    )


def get_logger(name: str) -> logging.Logger:
    configure_logging()
    return logging.getLogger(name)


def log_structured(logger: logging.Logger, level: int, event: str, **payload: Any) -> None:
    body = {'event': event, **payload}
    logger.log(level, json.dumps(body, default=str, ensure_ascii=True))
