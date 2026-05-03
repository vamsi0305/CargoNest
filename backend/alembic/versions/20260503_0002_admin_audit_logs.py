"""Add admin audit logs"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '20260503_0002'
down_revision: Union[str, Sequence[str], None] = '20260503_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'admin_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('actor_user_id', sa.Integer(), nullable=True),
        sa.Column('actor_username', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('target_type', sa.String(), nullable=False),
        sa.Column('target_id', sa.Integer(), nullable=True),
        sa.Column('target_label', sa.String(), nullable=False),
        sa.Column('summary', sa.String(), nullable=False),
        sa.Column('details', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_admin_audit_logs_action', 'admin_audit_logs', ['action'], unique=False)
    op.create_index('ix_admin_audit_logs_actor_user_id', 'admin_audit_logs', ['actor_user_id'], unique=False)
    op.create_index('ix_admin_audit_logs_target_id', 'admin_audit_logs', ['target_id'], unique=False)
    op.create_index('ix_admin_audit_logs_target_type', 'admin_audit_logs', ['target_type'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_admin_audit_logs_target_type', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_target_id', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_actor_user_id', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_action', table_name='admin_audit_logs')
    op.drop_table('admin_audit_logs')
