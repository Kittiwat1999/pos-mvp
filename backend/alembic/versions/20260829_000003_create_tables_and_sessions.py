"""create tables and table sessions

Revision ID: 20260829_000003
Revises: 20260829_000002
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260829_000003"
down_revision: Union[str, None] = "20260829_000002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tables",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="AVAILABLE"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_tables_id", "tables", ["id"])
    op.create_index("ix_tables_status", "tables", ["status"])

    op.create_table(
        "table_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("table_id", sa.Integer(), nullable=False),
        sa.Column("qr_token", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="OPEN"),
        sa.Column("opened_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["table_id"], ["tables.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("qr_token"),
    )
    op.create_index("ix_table_sessions_id", "table_sessions", ["id"])
    op.create_index("ix_table_sessions_table_id", "table_sessions", ["table_id"])
    op.create_index("ix_table_sessions_status", "table_sessions", ["status"])


def downgrade() -> None:
    op.drop_index("ix_table_sessions_status", table_name="table_sessions")
    op.drop_index("ix_table_sessions_table_id", table_name="table_sessions")
    op.drop_index("ix_table_sessions_id", table_name="table_sessions")
    op.drop_table("table_sessions")
    op.drop_index("ix_tables_status", table_name="tables")
    op.drop_index("ix_tables_id", table_name="tables")
    op.drop_table("tables")
