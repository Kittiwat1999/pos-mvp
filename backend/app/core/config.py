import os
from dataclasses import dataclass, field


def _env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return value


def _env_bool(name: str, default: bool) -> bool:
    value = _env(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    value = _env(name)
    return default if value is None else int(value)


def _env_list(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    value = _env(name)
    return default if value is None else tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    ENVIRONMENT: str = field(default_factory=lambda: _env("ENVIRONMENT", "development") or "development")
    DEBUG: bool = field(default_factory=lambda: _env_bool("DEBUG", True))
    SECRET_SALT: str = field(default_factory=lambda: _env("SECRET_SALT", "dev-secret-salt-change-me") or "")
    SECRET_KEY: str = field(default_factory=lambda: _env("SECRET_KEY", "dev-secret-key-change-me") or "")
    JWT_ALGORITHM: str = field(default_factory=lambda: _env("JWT_ALGORITHM", "HS256") or "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = field(default_factory=lambda: _env_int("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    REFRESH_TOKEN_EXPIRE_DAYS: int = field(default_factory=lambda: _env_int("REFRESH_TOKEN_EXPIRE_DAYS", 7))
    DATABASE_URL: str = field(default_factory=lambda: _env("DATABASE_URL", "postgresql+psycopg://postgres:postgres@db:5432/pos_mvp") or "")
    CORS_ORIGINS: tuple[str, ...] = field(default_factory=lambda: _env_list("CORS_ORIGINS", ("http://localhost:5173", "http://127.0.0.1:5173")))
    MINIO_ENDPOINT: str = field(default_factory=lambda: _env("MINIO_ENDPOINT", "minio:9000") or "")
    MINIO_ACCESS_KEY: str = field(default_factory=lambda: _env("MINIO_ACCESS_KEY", "minioadmin") or "")
    MINIO_SECRET_KEY: str = field(default_factory=lambda: _env("MINIO_SECRET_KEY", "minioadmin") or "")
    MINIO_BUCKET: str = field(default_factory=lambda: _env("MINIO_BUCKET", "pos-dev-media") or "")
    MINIO_REGION: str = field(default_factory=lambda: _env("MINIO_REGION", "us-east-1") or "")
    AWS_S3_ENDPOINT_URL: str = field(default_factory=lambda: _env("AWS_S3_ENDPOINT_URL", "http://minio:9000") or "")

    def __post_init__(self) -> None:
        if self.ENVIRONMENT.lower() in {"production", "prod"}:
            if self.DEBUG:
                raise ValueError("DEBUG must be false in production")
            if len(self.SECRET_KEY) < 32 or self.SECRET_KEY == "dev-secret-key-change-me":
                raise ValueError("SECRET_KEY must be a unique value of at least 32 characters in production")


settings = Settings()
