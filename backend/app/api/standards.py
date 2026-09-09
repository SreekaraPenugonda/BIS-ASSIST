import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_optional_user, require_admin
from app.core.config import get_settings
from app.database import SessionLocal
from app.database.connection import get_db
from app.models.document import Document, DocumentChunk
from app.models.user import User
from app.schemas.standards import (
    IndexResult,
    RecommendRequest,
    RecommendResponse,
    StandardListItem,
    StandardListResponse,
)
from app.services import pdf_service, rag_service, recommendation_service, standards_service

settings = get_settings()
router = APIRouter(prefix="/standards", tags=["standards"])


@router.get("", response_model=StandardListResponse)
def list_standards(
    q: str = "",
    category: str = "all",
    page: int = 1,
    size: int = 12,
):
    page = max(1, page)
    size = min(max(1, size), 50)
    result = standards_service.search(q, category, page, size)
    items = [StandardListItem.model_validate(standards_service.to_item_dict(s)) for s in result["items"]]
    return StandardListResponse(
        items=items,
        total=result["total"],
        page=page,
        size=size,
        categories=result["categories"],
    )


@router.get("/{is_number}", response_model=StandardListItem)
def get_standard(is_number: str):
    std = standards_service.get_standard(is_number)
    if std is None:
        raise HTTPException(status_code=404, detail="Standard not found in the knowledge base.")
    return StandardListItem.model_validate(standards_service.to_item_dict(std))


@router.post("/recommend", response_model=RecommendResponse)
def recommend(payload: RecommendRequest):
    return RecommendResponse.model_validate(
        recommendation_service.recommend(payload.product_name, payload.description, payload.category)
    )


# ----------------------------------------------------------- admin: ingest
@router.post("/upload", response_model=IndexResult, dependencies=[Depends(require_admin)])
async def upload_document(file: UploadFile = File(...)):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext != "pdf":
        raise HTTPException(status_code=415, detail="Only PDF uploads are supported.")
    max_bytes = settings.max_pdf_mb * 1024 * 1024
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"PDF too large (max {settings.max_pdf_mb} MB).")
    try:
        pages = pdf_service.extract_pdf_pages(data)
        chunks = pdf_service.chunk_pages(pages)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    db = SessionLocal()
    try:
        doc = Document(
            filename=file.filename or "upload.pdf",
            document_type="upload",
            chunk_count=len(chunks),
        )
        db.add(doc)
        db.flush()
        for chunk in chunks:
            db.add(
                DocumentChunk(
                    document_id=doc.id,
                    page_number=chunk["page_number"],
                    section=chunk["section"],
                    content=chunk["content"],
                    token_count=len(chunk["content"].split()),
                )
            )
            rag_service.rag_index.add_entry(
                document=doc.filename,
                content=chunk["content"],
                page=chunk["page_number"],
                section=chunk["section"],
                url="https://www.bis.gov.in",
            )
        db.commit()
        db.refresh(doc)
    finally:
        db.close()
    rag_service.rag_index.embed()
    return IndexResult(filename=doc.filename, chunk_count=len(chunks), document_id=doc.id)