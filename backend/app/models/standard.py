from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Standard(Base):
    """A curated Indian Standard entry (seed data == indicative, verify on BIS portal)."""

    __tablename__ = "standards"

    id: Mapped[int] = mapped_column(primary_key=True)
    is_number: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    product_category: Mapped[str] = mapped_column(String(80), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    scope: Mapped[str] = mapped_column(Text, default="")
    requirements: Mapped[str] = mapped_column(Text, default="")  # newline separated
    keywords: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(40), default="CURRENT")
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=False)
    published_date: Mapped[str] = mapped_column(String(40), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    def requirement_list(self) -> list[str]:
        return [r.strip() for r in (self.requirements or "").split("\n") if r.strip()]

    def keyword_list(self) -> list[str]:
        return [k.strip().lower() for k in (self.keywords or "").split(",") if k.strip()]