from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.chat import Source, StandardRef


class ScanResult(BaseModel):
    status: str = "VERIFICATION_REQUIRED"
    confidence: float = Field(ge=0.0, le=1.0)
    verified: bool = False
    mode: str = "simulation"  # ai | simulation
    message: str
    product: Optional[dict] = None
    is_mark: Optional[dict] = None
    license_number: Optional[str] = None
    standard: Optional[StandardRef] = None
    sources: list[Source] = Field(default_factory=list)
    disclaimer: str = ""


class ScanHistoryItem(BaseModel):
    ts: str
    filename: str
    mode: str
    status: str