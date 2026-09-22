"""add settings tables

Revision ID: 232f61a9a402
Revises: 20260829_000005
Create Date: 2026-09-21 04:04:38.891128

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '232f61a9a402'
down_revision: Union[str, None] = '20260829_000005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    op.create_table(
        "settings_str",
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("value", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("key"),
    )
    
    op.create_table(
        "settings_int",
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("value", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("key"),

    )
    
    op.create_table(
        "settings_bool",
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("value", sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint("key"),
    )
    
    op.create_unique_constraint(
        "uq_settings_str_key",
        "settings_str",
        ["key"],
    )
    
    op.create_unique_constraint(
        "uq_settings_int_key",
        "settings_int",
        ["key"],
    )

    op.create_unique_constraint(
        "uq_settings_bool_key",
        "settings_bool",
        ["key"],
    )
    
def downgrade():
    op.drop_constraint(
        "uq_settings_str_key",
        "settings_str",
        type_="unique"
    )
    
    op.drop_constraint(
        "uq_settings_int_key",
        "settings_int",
        type_="unique"
    )
    
    op.drop_constraint(
        "uq_settings_bool_key",
        "settings_bool",
        type_="unique"
    )
    op.drop_table("settings_str")
    op.drop_table("settings_int")
    op.drop_table("settings_bool")
