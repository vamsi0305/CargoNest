import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete
from fastapi import Response
from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.config import settings
from app.models.role import Role
from app.models.user_account import UserAccount
from app.models.user_session import UserSession
from app.schemas.auth import FORM_ACCESS_OPTIONS, RoleRead, UserRead


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    password_salt = salt or secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        password_salt.encode('utf-8'),
        200_000,
    ).hex()
    return password_hash, password_salt


def verify_password(password: str, password_hash: str, password_salt: str) -> bool:
    next_hash, _ = hash_password(password, password_salt)
    return hmac.compare_digest(next_hash, password_hash)


def get_role_map(session: Session) -> dict[int, Role]:
    roles = session.exec(select(Role)).all()
    return {role.id: role for role in roles if role.id is not None}


def to_role_read(role: Role) -> RoleRead:
    return RoleRead(
        id=role.id or 0,
        name=role.name,
        description=role.description,
        is_system=role.is_system,
    )


def resolve_allowed_forms_for_role(role: Role | None, forms: list[str]) -> list[str]:
    if role is not None and role.name == 'admin':
        return list(FORM_ACCESS_OPTIONS)
    return require_valid_forms(forms)


def to_user_read(user: UserAccount, role_map: dict[int, Role]) -> UserRead:
    role = role_map.get(user.role_id or -1)
    return UserRead(
        id=user.id or 0,
        username=user.username,
        email=user.email,
        role_id=user.role_id,
        role_name=role.name if role else 'Unassigned',
        allowed_forms=resolve_allowed_forms_for_role(role, user.allowed_forms),
        is_active=user.is_active,
        created_at=user.created_at,
    )


def normalize_forms(forms: list[str]) -> list[str]:
    seen: set[str] = set()
    normalized: list[str] = []

    for form_name in forms:
        key = form_name.strip()
        if key and key in FORM_ACCESS_OPTIONS and key not in seen:
            seen.add(key)
            normalized.append(key)

    return normalized


def require_valid_forms(forms: list[str]) -> list[str]:
    normalized = normalize_forms(forms)
    if len(normalized) != len([item for item in forms if item.strip()]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='One or more form access values are invalid.',
        )
    return normalized


def create_session_token(session: Session, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(hours=settings.session_duration_hours)
    record = UserSession(user_id=user_id, token=token, expires_at=expires_at)
    session.add(record)
    session.commit()
    return token


def build_csrf_token(token: str) -> str:
    return hmac.new(
        settings.session_secret_key.encode('utf-8'),
        token.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()


def set_auth_cookies(response: Response, token: str) -> None:
    max_age = settings.session_duration_hours * 60 * 60
    csrf_token = build_csrf_token(token)

    cookie_kwargs = {
        'max_age': max_age,
        'httponly': True,
        'secure': settings.session_cookie_secure,
        'samesite': settings.session_cookie_samesite,
        'path': '/',
    }
    response.set_cookie(settings.session_cookie_name, token, **cookie_kwargs)
    response.set_cookie(
        settings.csrf_cookie_name,
        csrf_token,
        max_age=max_age,
        httponly=False,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path='/',
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        settings.session_cookie_name,
        path='/',
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
    )
    response.delete_cookie(
        settings.csrf_cookie_name,
        path='/',
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
    )


def purge_expired_sessions(session: Session) -> None:
    now = datetime.now(UTC)
    result = session.execute(delete(UserSession).where(UserSession.expires_at <= now))
    if result.rowcount and result.rowcount > 0:
        session.commit()


def delete_user_sessions(session: Session, user_id: int, *, except_token: str | None = None) -> None:
    statement = delete(UserSession).where(UserSession.user_id == user_id)
    if except_token:
        statement = statement.where(UserSession.token != except_token)

    result = session.execute(statement)
    if result.rowcount and result.rowcount > 0:
        session.commit()


def ensure_system_roles(session: Session) -> None:
    desired_roles = {
        'admin': 'Full access to users, roles, and all forms.',
        'user': 'Standard form user access managed by admin.',
    }
    existing = {role.name: role for role in session.exec(select(Role)).all()}
    added_any = False

    for name, description in desired_roles.items():
        if name in existing:
            continue
        session.add(Role(name=name, description=description, is_system=True))
        added_any = True

    if added_any:
        session.commit()


def ensure_bootstrap_admin(session: Session) -> None:
    ensure_system_roles(session)

    if not settings.bootstrap_admin_enabled:
        return

    admin_username = settings.bootstrap_admin_username.strip()
    admin_email = settings.bootstrap_admin_email.strip().lower()
    admin_password = settings.bootstrap_admin_password.strip()

    if not admin_username or not admin_email or not admin_password:
        raise RuntimeError('Bootstrap admin is enabled but required bootstrap credentials are missing.')

    admin_user = session.exec(select(UserAccount).where(UserAccount.email == admin_email)).first()
    if admin_user:
        return

    admin_role = session.exec(select(Role).where(Role.name == 'admin')).first()
    if admin_role is None:
        raise RuntimeError('Admin role could not be initialized.')

    password_hash, password_salt = hash_password(admin_password)
    user = UserAccount(
        username=admin_username,
        email=admin_email,
        password_hash=password_hash,
        password_salt=password_salt,
        role_id=admin_role.id,
        allowed_forms=list(FORM_ACCESS_OPTIONS),
        is_active=True,
    )
    session.add(user)
    session.commit()


def user_is_admin(user: UserAccount, role_map: dict[int, Role]) -> bool:
    role = role_map.get(user.role_id or -1)
    return role is not None and role.name == 'admin'


def require_form_access(user: UserAccount, role_map: dict[int, Role], access_key: str) -> None:
    if user_is_admin(user, role_map):
        return

    if access_key not in user.allowed_forms:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='You do not have access to this form.',
        )
