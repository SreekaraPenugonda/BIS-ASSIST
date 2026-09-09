from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class StandardListItem(BaseModel):
    is_number: str
    title: str
    product_category: str
    status: str
    is_mandatory: bool
    published_date: str
    description: str
    scope: str
    requirements: list[str] = Field(default_factory=list)


class StandardListResponse(BaseModel):
    items: list[StandardListItem]
    total: int
    page: int
    size: int
    categories: list[str]


class StandardsSearchResponse(BaseModel):
    query: str
    standard: Optional[StandardListItem] = None
    sources: list[str] = Field(default_factory=list)


class RecommendRequest(BaseModel):
    product_name: str = Field(min_length=2, max_length=200)
    category: Optional[str] = None
    description: Optional[str] = Field(default=None, max_length=2000)


class RecommendResponse(BaseModel):
    product: str
    category: str
    standards: list[dict]
    disclaimer: str = ""


class IndexResult(BaseModel):
    filename: str
    chunk_count: int
    document_id: int