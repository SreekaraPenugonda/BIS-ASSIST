from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class Source(BaseModel):
    """A citation returned with every AI answer."""

    document: str
    page: Optional[int] = None
    section: Optional[str] = None
    url: Optional[str] = None


class StandardRef(BaseModel):
    is_number: str
    title: str
    relevance: Literal["high", "medium", "low"] = "medium"
    status: str = "CURRENT"


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    language: Literal["en", "hi", "te"] = "en"
    conversation_id: Optional[int] = None
    history: list[ChatTurn] = Field(default_factory=list)


class StructuredAnswer(BaseModel):
    answer: str
    status: str = "INFO"  # INFO | PRODUCT_SPECIFIC | VERIFICATION_REQUIRED | NOT_FOUND
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    intent: str = "general"
    standards: list[StandardRef] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)
    disclaimer: str = ""


class ChatResponse(BaseModel):
    conversation_id: int
    user_message: str
    response_mode: Literal["ai", "simulation"]
    language: str
    structured: StructuredAnswer
    created_at: datetime


class StreamEvent(BaseModel):
    type: Literal["token", "meta", "done", "error"]
    content: Optional[str] = None
    meta: Optional[StructuredAnswer] = None
    error: Optional[str] = None