from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base

PASSWORD_HASH_LEN = 512


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(PASSWORD_HASH_LEN), nullable=False)
    # consumer | msme | admin
    role: Mapped[str] = mapped_column(String(20), default="consumer", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    @property
    def display_role(self) -> str:
        return {"consumer": "Consumer", "msme": "MSME", "admin": "Admin"}.get(self.role, self.role)