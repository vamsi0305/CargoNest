from typing import Any

from sqlmodel import Session

from app.models.admin_audit_log import AdminAuditLog
from app.models.role import Role
from app.models.user_account import UserAccount


def record_admin_audit_log(
    session: Session,
    *,
    actor: UserAccount,
    action: str,
    target_type: str,
    target_id: int | None,
    target_label: str,
    summary: str,
    details: dict[str, Any],
) -> AdminAuditLog:
    log = AdminAuditLog(
        actor_user_id=actor.id,
        actor_username=actor.username,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_label=target_label,
        summary=summary,
        details=details,
    )
    session.add(log)
    return log


def build_role_create_audit_details(role: Role) -> dict[str, Any]:
    return {
        'role': {
            'id': role.id,
            'name': role.name,
            'description': role.description,
            'is_system': role.is_system,
        }
    }


def build_user_create_audit_details(user: UserAccount, role_name: str) -> dict[str, Any]:
    return {
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role_name': role_name,
            'allowed_forms': list(user.allowed_forms),
            'is_active': user.is_active,
        }
    }


def build_user_update_audit_details(
    before: dict[str, Any],
    after: dict[str, Any],
    *,
    password_changed: bool,
) -> dict[str, Any]:
    changes: list[dict[str, Any]] = []

    for field_name, before_value in before.items():
        after_value = after[field_name]
        if before_value != after_value:
            changes.append(
                {
                    'field': field_name,
                    'before': before_value,
                    'after': after_value,
                }
            )

    if password_changed:
        changes.append(
            {
                'field': 'password',
                'before': None,
                'after': 'updated',
            }
        )

    return {
        'changes': changes,
        'changed_fields': [item['field'] for item in changes],
    }
