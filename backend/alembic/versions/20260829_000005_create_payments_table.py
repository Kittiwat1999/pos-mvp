"""create payments table

Revision ID: 20260829_000005
Revises: 20260829_000004
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260829_000005"
down_revision: Union[str, None] = "20260829_000004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("table_session_id", sa.Integer(), nullable=False),
        sa.Column("method", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("reference", sa.String(length=100), nullable=True),
        sa.Column("receipt_number", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["table_session_id"], ["table_sessions.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("table_session_id"),
        sa.UniqueConstraint("receipt_number"),
    )
    op.create_index("ix_payments_id", "payments", ["id"])
    op.create_index("ix_payments_table_session_id", "payments", ["table_session_id"])
    op.create_index("ix_payments_receipt_number", "payments", ["receipt_number"])


def downgrade() -> None:
    op.drop_index("ix_payments_receipt_number", table_name="payments")
    op.drop_index("ix_payments_table_session_id", table_name="payments")
    op.drop_index("ix_payments_id", table_name="payments")
    op.drop_table("payments")
