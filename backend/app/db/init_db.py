from sqlalchemy import text

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import engine
from app.models.user import User


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT 1 FROM users WHERE username = :username"),
            {"username": "admin"},
        ).fetchone()
        if row is None:
            conn.execute(
                text(
                    "INSERT INTO users (username, password_hash, role) VALUES (:username, :password_hash, :role)"
                ),
                {
                    "username": "admin",
                    "password_hash": hash_password("admin123"),
                    "role": "admin",
                },
            )
