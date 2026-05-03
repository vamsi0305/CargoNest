from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlmodel import Session, select

from app.api.deps.auth import (
    get_admin_user,
    get_current_session_record,
    get_current_user,
    require_csrf_token,
)
from app.models.admin_audit_log import AdminAuditLog
from app.core.database import get_session
from app.models.role import Role
from app.models.user_account import UserAccount
from app.models.user_session import UserSession
from app.schemas.auth import (
    AdminAuditLogRead,
    AuthSessionResponse,
    ChangePasswordRequest,
    FormAccessOptionsResponse,
    LoginRequest,
    MeResponse,
    RoleCreate,
    RoleRead,
    UserCreate,
    UserRead,
    UserUpdate,
)
from app.services.audit import (
    build_role_create_audit_details,
    build_user_create_audit_details,
    build_user_update_audit_details,
    record_admin_audit_log,
)
from app.services.auth import (
    FORM_ACCESS_OPTIONS,
    create_session_token,
    delete_user_sessions,
    get_role_map,
    hash_password,
    clear_auth_cookies,
    resolve_allowed_forms_for_role,
    set_auth_cookies,
    to_role_read,
    to_user_read,
    verify_password,
)
from app.services.rate_limit import auth_burst_limiter, login_failure_guard

router = APIRouter(tags=['auth'])


def ensure_unique_user_identity(
    session: Session,
    *,
    email: str | None = None,
    username: str | None = None,
    exclude_user_id: int | None = None,
) -> None:
    if email is not None:
        existing_email_user = session.exec(select(UserAccount).where(UserAccount.email == email)).first()
        if existing_email_user is not None and existing_email_user.id != exclude_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email is already in use.')

    if username is not None:
        existing_username_user = session.exec(select(UserAccount).where(UserAccount.username == username)).first()
        if existing_username_user is not None and existing_username_user.id != exclude_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username is already in use.')


@router.post('/auth/login', response_model=AuthSessionResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
):
    client_host = request.client.host if request.client else 'unknown'
    burst_key = f'login:ip:{client_host}'
    failure_key = f'login:failure:{client_host}:{payload.email}'

    auth_burst_limiter.enforce(
        burst_key,
        limit=10,
        window_seconds=60,
        detail='Too many login attempts from this IP. Please try again in a minute.',
    )
    login_failure_guard.enforce(
        failure_key,
        max_failures=5,
        window_seconds=15 * 60,
        detail='Too many failed login attempts. Please wait 15 minutes before trying again.',
    )

    user = session.exec(select(UserAccount).where(UserAccount.email == payload.email)).first()
    if user is None or not user.is_active:
        login_failure_guard.register_failure(failure_key, window_seconds=15 * 60)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid email or password.')

    if not verify_password(payload.password, user.password_hash, user.password_salt):
        login_failure_guard.register_failure(failure_key, window_seconds=15 * 60)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid email or password.')

    login_failure_guard.clear(failure_key)
    token = create_session_token(session, user.id or 0)
    set_auth_cookies(response, token)
    role_map = get_role_map(session)
    return AuthSessionResponse(user=to_user_read(user, role_map))


@router.post('/auth/logout')
def logout(
    response: Response,
    current_user: UserAccount = Depends(get_current_user),
    current_session: UserSession = Depends(get_current_session_record),
    _: None = Depends(require_csrf_token),
    session: Session = Depends(get_session),
):
    session.delete(current_session)
    session.commit()
    clear_auth_cookies(response)
    return {'success': True}


@router.post('/auth/logout-all')
def logout_all(
    response: Response,
    current_user: UserAccount = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
    session: Session = Depends(get_session),
):
    delete_user_sessions(session, current_user.id or 0)
    clear_auth_cookies(response)
    return {'success': True}


@router.get('/auth/me', response_model=MeResponse)
def me(
    current_user: UserAccount = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    role_map = get_role_map(session)
    return MeResponse(user=to_user_read(current_user, role_map))


@router.post('/auth/change-password')
def change_password(
    payload: ChangePasswordRequest,
    response: Response,
    current_user: UserAccount = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
    session: Session = Depends(get_session),
):
    if not verify_password(payload.current_password, current_user.password_hash, current_user.password_salt):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Current password is incorrect.')

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='New password must be different from the current password.',
        )

    current_user.password_hash, current_user.password_salt = hash_password(payload.new_password)
    session.add(current_user)
    session.commit()
    delete_user_sessions(session, current_user.id or 0)
    clear_auth_cookies(response)
    return {'success': True, 'message': 'Password updated. Please sign in again.'}


@router.get('/admin/form-access-options', response_model=FormAccessOptionsResponse)
def form_access_options(current_user: UserAccount = Depends(get_admin_user)):
    return FormAccessOptionsResponse(options=list(FORM_ACCESS_OPTIONS))


@router.get('/admin/roles', response_model=list[RoleRead])
def list_roles(
    current_user: UserAccount = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    roles = session.exec(select(Role).order_by(Role.name)).all()
    return [to_role_read(role) for role in roles]


@router.get('/admin/audit-logs', response_model=list[AdminAuditLogRead])
def list_audit_logs(
    limit: int = Query(default=100, ge=1, le=250),
    current_user: UserAccount = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    records = session.exec(
        select(AdminAuditLog).order_by(AdminAuditLog.created_at.desc(), AdminAuditLog.id.desc()).limit(limit)
    ).all()
    return [
        AdminAuditLogRead(
            id=record.id or 0,
            actor_user_id=record.actor_user_id,
            actor_username=record.actor_username,
            action=record.action,
            target_type=record.target_type,
            target_id=record.target_id,
            target_label=record.target_label,
            summary=record.summary,
            details=record.details,
            created_at=record.created_at,
        )
        for record in records
    ]


@router.post('/admin/roles', response_model=RoleRead)
def create_role(
    payload: RoleCreate,
    current_user: UserAccount = Depends(get_admin_user),
    _: None = Depends(require_csrf_token),
    session: Session = Depends(get_session),
):
    existing = session.exec(select(Role).where(Role.name == payload.name.strip().lower())).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Role already exists.')

    role = Role(name=payload.name.strip().lower(), description=payload.description.strip())
    session.add(role)
    session.flush()
    record_admin_audit_log(
        session,
        actor=current_user,
        action='role_created',
        target_type='role',
        target_id=role.id,
        target_label=role.name,
        summary=f'Created role {role.name}.',
        details=build_role_create_audit_details(role),
    )
    session.commit()
    session.refresh(role)
    return to_role_read(role)


@router.get('/admin/users', response_model=list[UserRead])
def list_users(
    current_user: UserAccount = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    users = session.exec(select(UserAccount).order_by(UserAccount.created_at.desc())).all()
    role_map = get_role_map(session)
    return [to_user_read(user, role_map) for user in users]


@router.post('/admin/users', response_model=UserRead)
def create_user(
    payload: UserCreate,
    current_user: UserAccount = Depends(get_admin_user),
    _: None = Depends(require_csrf_token),
    session: Session = Depends(get_session),
):
    role = session.get(Role, payload.role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid role.')

    normalized_forms = resolve_allowed_forms_for_role(role, payload.allowed_forms)
    username = payload.username.strip()
    email = payload.email.lower()

    ensure_unique_user_identity(session, email=email, username=username)

    password_hash, password_salt = hash_password(payload.password)
    user = UserAccount(
        username=username,
        email=email,
        password_hash=password_hash,
        password_salt=password_salt,
        role_id=payload.role_id,
        allowed_forms=normalized_forms,
        is_active=payload.is_active,
    )
    session.add(user)
    session.flush()
    record_admin_audit_log(
        session,
        actor=current_user,
        action='user_created',
        target_type='user',
        target_id=user.id,
        target_label=user.username,
        summary=f'Created user {user.username} with role {role.name}.',
        details=build_user_create_audit_details(user, role.name),
    )
    session.commit()
    session.refresh(user)

    role_map = get_role_map(session)
    return to_user_read(user, role_map)


@router.patch('/admin/users/{user_id}', response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: UserAccount = Depends(get_admin_user),
    _: None = Depends(require_csrf_token),
    session: Session = Depends(get_session),
):
    user = session.get(UserAccount, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')

    role_map = get_role_map(session)
    before_state = {
        'username': user.username,
        'email': user.email,
        'role_name': role_map.get(user.role_id or -1).name if role_map.get(user.role_id or -1) else 'Unassigned',
        'allowed_forms': list(user.allowed_forms),
        'is_active': user.is_active,
    }
    next_username = payload.username.strip() if payload.username is not None else user.username
    next_email = payload.email.lower() if payload.email is not None else user.email

    ensure_unique_user_identity(
        session,
        email=next_email,
        username=next_username,
        exclude_user_id=user.id,
    )

    if payload.role_id is not None:
        role = session.get(Role, payload.role_id)
        if role is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid role.')
        user.role_id = payload.role_id
        if role.name == 'admin':
            user.allowed_forms = list(FORM_ACCESS_OPTIONS)

    if payload.allowed_forms is not None:
        role_for_forms = session.get(Role, user.role_id) if user.role_id is not None else None
        user.allowed_forms = resolve_allowed_forms_for_role(role_for_forms, payload.allowed_forms)

    if payload.username is not None:
        user.username = next_username

    if payload.email is not None:
        user.email = next_email

    if payload.password is not None:
        user.password_hash, user.password_salt = hash_password(payload.password)

    if payload.is_active is not None:
        user.is_active = payload.is_active

    session.add(user)
    try:
        session.flush()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='User email or username is already in use.',
        ) from exc
    refreshed_role_map = get_role_map(session)
    after_state = {
        'username': user.username,
        'email': user.email,
        'role_name': refreshed_role_map.get(user.role_id or -1).name
        if refreshed_role_map.get(user.role_id or -1)
        else 'Unassigned',
        'allowed_forms': list(user.allowed_forms),
        'is_active': user.is_active,
    }
    audit_details = build_user_update_audit_details(
        before_state,
        after_state,
        password_changed=payload.password is not None,
    )
    changed_fields: list[str] = audit_details.get('changed_fields', [])
    summary_suffix = ', '.join(changed_fields) if changed_fields else 'no tracked fields'
    record_admin_audit_log(
        session,
        actor=current_user,
        action='user_updated',
        target_type='user',
        target_id=user.id,
        target_label=user.username,
        summary=f'Updated user {user.username}: {summary_suffix}.',
        details=audit_details,
    )
    session.commit()
    session.refresh(user)

    role_map = get_role_map(session)
    return to_user_read(user, role_map)
