from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.models.application import APPLICATION_STATUSES


class ApplicationCreate(BaseModel):
    product_name: str = Field(min_length=2, max_length=200)
    category: str = ""
    is_number: str = ""
    standard_title: str = ""
    notes: Optional[str] = Field(default=None, max_length=2000)


class StatusUpdate(BaseModel):
    status: Literal[tuple(APPLICATION_STATUSES)]  # type: ignore[arg-type]


class ApplicationOut(BaseModel):
    id: int
    application_number: str
    user_id: int
    user_name: str = ""
    product_name: str
    category: str
    is_number: str
    standard_title: str
    status: str
    notes: str
    submitted_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}