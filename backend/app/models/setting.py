from sqlalchemy import String, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class SettingStr(Base):
    __tablename__ = "settings_str"

    key: Mapped[str] = mapped_column(String(255), primary_key=True)
    value: Mapped[str | None] = mapped_column(String(500), nullable=True)


class SettingInt(Base):
    __tablename__ = "settings_int"

    key: Mapped[str] = mapped_column(String(255), primary_key=True)
    value: Mapped[int | None] = mapped_column(Integer, nullable=True)


class SettingBool(Base):
    __tablename__ = "settings_bool"

    key: Mapped[str] = mapped_column(String(255), primary_key=True)
    value: Mapped[bool | None] = mapped_column(Boolean, nullable=True)