"""Initial schema"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '20260503_0001'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'form_submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('form_type', sa.String(), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_form_submissions_form_type', 'form_submissions', ['form_type'], unique=False)

    op.create_table(
        'purchase_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cargo_no', sa.String(), nullable=False),
        sa.Column('po_no', sa.String(), nullable=False),
        sa.Column('buyer', sa.String(), nullable=False),
        sa.Column('agent_name', sa.String(), nullable=False),
        sa.Column('destination', sa.String(), nullable=False),
        sa.Column('po_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('progress', sa.Integer(), nullable=False),
        sa.Column('total_quantity_kg', sa.Float(), nullable=False),
        sa.Column('shipment_target', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_purchase_orders_cargo_no', 'purchase_orders', ['cargo_no'], unique=True)
    op.create_index('ix_purchase_orders_po_no', 'purchase_orders', ['po_no'], unique=False)

    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('is_system', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_roles_name', 'roles', ['name'], unique=True)

    op.create_table(
        'user_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('password_salt', sa.String(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.Column('allowed_forms', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_accounts_email', 'user_accounts', ['email'], unique=True)
    op.create_index('ix_user_accounts_username', 'user_accounts', ['username'], unique=True)

    op.create_table(
        'user_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user_accounts.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_sessions_token', 'user_sessions', ['token'], unique=True)
    op.create_index('ix_user_sessions_user_id', 'user_sessions', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_user_sessions_user_id', table_name='user_sessions')
    op.drop_index('ix_user_sessions_token', table_name='user_sessions')
    op.drop_table('user_sessions')

    op.drop_index('ix_user_accounts_username', table_name='user_accounts')
    op.drop_index('ix_user_accounts_email', table_name='user_accounts')
    op.drop_table('user_accounts')

    op.drop_index('ix_roles_name', table_name='roles')
    op.drop_table('roles')

    op.drop_index('ix_purchase_orders_po_no', table_name='purchase_orders')
    op.drop_index('ix_purchase_orders_cargo_no', table_name='purchase_orders')
    op.drop_table('purchase_orders')

    op.drop_index('ix_form_submissions_form_type', table_name='form_submissions')
    op.drop_table('form_submissions')
