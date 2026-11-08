# Database Manual

This project uses PostgreSQL for application data and Alembic for schema migrations. The database is available through the `db` Docker Compose service.

## Start the database

From the repository root:

```bash
docker compose up -d db
```

Check that PostgreSQL is healthy:

```bash
docker compose ps db
```

Start the backend and the rest of the stack when needed:

```bash
docker compose up -d --build
```

## Run migrations

Run all pending migrations from inside the backend container:

```bash
docker compose exec backend alembic upgrade head
```

Check the database's current Alembic revision:

```bash
docker compose exec backend alembic current
```

Show the migration history:

```bash
docker compose exec backend alembic history
```

Generate SQL without applying it:

```bash
docker compose exec backend alembic upgrade head --sql
```

Apply only the next migration:

```bash
docker compose exec backend alembic upgrade +1
```

Downgrade one migration:

```bash
docker compose exec backend alembic downgrade -1
```

Run a specific revision:

```bash
docker compose exec backend alembic upgrade <revision>
```

Replace `<revision>` with a revision ID from `alembic history`.

## Seed the database

The backend calls `init_db()` during application startup. This creates the default admin user and inserts missing seed data for:

- Restaurant settings
- Service types
- Categories
- Products
- Tables

The seed operation is idempotent for the records it manages. Start or restart the backend to run it:

```bash
docker compose restart backend
```

To run the seed directly without restarting the backend:

```bash
docker compose exec backend python -c "from app.db.init_db import init_db; init_db()"
```

The default development login created by the seed is:

```text
username: admin
password: admin123
```

Change development credentials before using the application in a shared or production environment.

## Recommended setup order

For a fresh local database:

```bash
docker compose up -d db minio
docker compose run --rm backend alembic upgrade head
docker compose up -d backend
docker compose exec backend python -c "from app.db.init_db import init_db; init_db()"
```

The backend startup also runs the seed, so the final command is optional when the backend has already started successfully.

## Reset local database

This deletes all PostgreSQL data stored in the Compose volume. Use only for local development:

```bash
docker compose down -v
docker compose up -d db minio
docker compose run --rm backend alembic upgrade head
docker compose up -d --build backend
docker compose exec backend python -m app.db.seed_tables
```

Because the backend seeds data on startup, the default records will be recreated after the reset.

## Troubleshooting

If `docker compose exec backend ...` reports that the backend container is not running, start it first:

```bash
docker compose up -d backend
```

If the database connection fails, check the service logs:

```bash
docker compose logs db
```

If migration commands are run from the host instead of Docker, use the backend virtual environment and ensure `DATABASE_URL` points to a host-reachable PostgreSQL address. From the host, the Compose database is normally reachable at `localhost:5432`; from a container, use the Compose service hostname `db`.
