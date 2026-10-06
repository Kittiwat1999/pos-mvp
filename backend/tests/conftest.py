import pytest
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.session import engine
from app.main import app


@pytest.fixture(autouse=True)
def rollback_test_data():
    connection = engine.connect()
    transaction = connection.begin()
    previous_override = app.dependency_overrides.get(get_db)
    app.state.test_db_connection = connection

    def override_get_db():
        with Session(
            bind=connection,
            join_transaction_mode="create_savepoint",
        ) as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield
    finally:
        if previous_override is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_override
        del app.state.test_db_connection
        transaction.rollback()
        connection.close()