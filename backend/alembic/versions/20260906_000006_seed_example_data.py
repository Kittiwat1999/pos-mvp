"""seed example POS data without users

Revision ID: 20260906_000006
Revises: 20260829_000005
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260906_000006"
down_revision: Union[str, None] = "20260829_000005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    categories = sa.table(
        "categories",
        sa.column("id", sa.Integer),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("active", sa.Boolean),
    )

    products = sa.table(
        "products",
        sa.column("id", sa.Integer),
        sa.column("category_id", sa.Integer),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("price", sa.Numeric),
        sa.column("active", sa.Boolean),
        sa.column("stock_quantity", sa.Integer),
        sa.column("add_ons", sa.JSON),
    )

    tables = sa.table(
        "tables",
        sa.column("id", sa.Integer),
        sa.column("name", sa.String),
        sa.column("status", sa.String),
    )

    sessions = sa.table(
        "table_sessions",
        sa.column("id", sa.Integer),
        sa.column("table_id", sa.Integer),
        sa.column("qr_token", sa.String),
        sa.column("status", sa.String),
        sa.column("closed_at", sa.DateTime),
    )

    orders = sa.table(
        "orders",
        sa.column("id", sa.Integer),
        sa.column("table_session_id", sa.Integer),
        sa.column("status", sa.String),
        sa.column("subtotal", sa.Numeric),
        sa.column("discount", sa.Numeric),
        sa.column("tax", sa.Numeric),
        sa.column("total", sa.Numeric),
    )

    order_items = sa.table(
        "order_items",
        sa.column("id", sa.Integer),
        sa.column("order_id", sa.Integer),
        sa.column("product_id", sa.Integer),
        sa.column("product_name", sa.String),
        sa.column("quantity", sa.Integer),
        sa.column("unit_price", sa.Numeric),
        sa.column("discount", sa.Numeric),
        sa.column("note", sa.String),
    )

    payments = sa.table(
        "payments",
        sa.column("id", sa.Integer),
        sa.column("table_session_id", sa.Integer),
        sa.column("method", sa.String),
        sa.column("amount", sa.Numeric),
        sa.column("reference", sa.String),
        sa.column("receipt_number", sa.String),
    )

    op.bulk_insert(categories, [
        {"id": 1, "name": "Coffee", "description": "Hot and iced coffee", "active": True},
        {"id": 2, "name": "Food", "description": "Cafe food and snacks", "active": True},
    ])

    op.bulk_insert(products, [
        {
            "id": 1,
            "category_id": 1,
            "name": "Americano",
            "description": "Espresso with hot water",
            "price": 60.00,
            "active": True,
            "stock_quantity": 100,
            "add_ons": [{"name": "Extra shot", "price": 20}],
        },
        {
            "id": 2,
            "category_id": 1,
            "name": "Cappuccino",
            "description": "Espresso with steamed milk",
            "price": 75.00,
            "active": True,
            "stock_quantity": 100,
            "add_ons": [{"name": "Oat milk", "price": 15}],
        },
        {
            "id": 3,
            "category_id": 2,
            "name": "Club Sandwich",
            "description": "Toasted sandwich with chicken and vegetables",
            "price": 140.00,
            "active": True,
            "stock_quantity": 30,
            "add_ons": [],
        },
        {
            "id": 4,
            "category_id": 2,
            "name": "French Fries",
            "description": "Crispy salted fries",
            "price": 90.00,
            "active": True,
            "stock_quantity": 50,
            "add_ons": [],
        },
    ])

    op.bulk_insert(tables, [
        {"id": 1, "name": "Table 1", "status": "AVAILABLE"},
        {"id": 2, "name": "Table 2", "status": "OCCUPIED"},
        {"id": 3, "name": "Table 3", "status": "AVAILABLE"},
    ])


def downgrade() -> None:
    op.execute("DELETE FROM payments WHERE id = 1")
    op.execute("DELETE FROM order_items WHERE id IN (1, 2, 3, 4)")
    op.execute("DELETE FROM orders WHERE id IN (1, 2)")
    op.execute("DELETE FROM table_sessions WHERE id IN (1, 2)")
    op.execute("DELETE FROM tables WHERE id IN (1, 2, 3)")
    op.execute("DELETE FROM products WHERE id IN (1, 2, 3, 4)")
    op.execute("DELETE FROM categories WHERE id IN (1, 2)")