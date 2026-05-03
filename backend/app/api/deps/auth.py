from datetime import UTC, datetime

from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_session
from app.models.user_account import UserAccount
from app.models.user_session import UserSession
from app.services.auth import build_csrf_token, get_role_map, purge_expired_sessions, user_is_admin

bearer_scheme = HTTPBearer(auto_error=False)


def _get_session_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session_cookie: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> str:
    if credentials is not None and credentials.scheme.lower() == 'bearer':
        return credentials.credentials

    if session_cookie:
        return session_cookie

    header_token = request.cookies.get(settings.session_cookie_name)
    if header_token:
        return header_token

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication required.')


def get_current_session_record(
    token: str = Depends(_get_session_token),
    session: Session = Depends(get_session),
) -> UserSession:
    purge_expired_sessions(session)
    session_record = session.exec(select(UserSession).where(UserSession.token == token)).first()
    if session_record is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid session token.')

    if session_record.expires_at.replace(tzinfo=UTC) <= datetime.now(UTC):
        session.delete(session_record)
        session.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Session expired.')

    return session_record


def get_current_user(
    session_record: UserSession = Depends(get_current_session_record),
    session: Session = Depends(get_session),
) -> UserAccount:
    user = session.get(UserAccount, session_record.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User account is not active.')

    return user


def require_csrf_token(
    request: Request,
    session_record: UserSession = Depends(get_current_session_record),
) -> None:
    csrf_token = request.headers.get('X-CSRF-Token', '').strip()
    expected_token = build_csrf_token(session_record.token)
    if not csrf_token or csrf_token != expected_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='CSRF protection token is missing or invalid.',
        )


def get_admin_user(
    current_user: UserAccount = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UserAccount:
    role_map = get_role_map(session)
    if not user_is_admin(current_user, role_map):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required.')

    return current_user
