from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.config import get_settings
from app.core.stats import stats
from app.database.connection import get_db
from app.models.application import Application
from app.models.document import Document, DocumentChunk
from app.models.standard import Standard
from app.models.user import User
from app.services import rag_service

settings = get_settings()
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/stats")
def admin_stats(db: Session = Depends(get_db)):
    counts = {
        "users": db.query(func.count(User.id)).scalar() or 0,
        "standards": db.query(func.count(Standard.id)).scalar() or 0,
        "documents": db.query(func.count(Document.id)).scalar() or 0,
        "chunks": db.query(func.count(DocumentChunk.id)).scalar() or 0,
        "applications": db.query(func.count(Application.id)).scalar() or 0,
    }
    by_status = {
        row[0]: row[1]
        for row in db.query(Application.status, func.count(Application.id)).group_by(Application.status).all()
    }
    live = stats.snapshot()
    return {
        "counts": counts,
        "applications_by_status": by_status,
        "activity": live,
        "rag": {
            "entries": len(rag_service.rag_index.entries),
            "uses_gemini": rag_service.rag_index.uses_gemini,
            "configured": settings.ai_configured,
        },
        "system": {
            "environment": settings.environment,
            "database": "postgresql+pgvector ready" if not settings.is_sqlite else "sqlite (demo)",
            "gemini_model": settings.gemini_model,
        },
    }


@router.post("/reindex")
def reindex(db: Session = Depends(get_db)):
    rag_service.rag_index.clear()
    kb_count = rag_service.rag_index.load_knowledge_base()
    docs = db.query(Document).all()
    chunk_total = 0
    for doc in docs:
        for chunk in doc.chunks:
            rag_service.rag_index.add_entry(
                document=doc.filename,
                content=chunk.content,
                page=chunk.page_number,
                section=chunk.section,
                url="https://www.bis.gov.in",
            )
            chunk_total += 1
    embedded = rag_service.rag_index.embed()
    return {
        "knowledge_base_entries": kb_count,
        "document_chunks": chunk_total,
        "total_indexed": embedded,
        "mode": "gemini" if rag_service.rag_index.uses_gemini else "local-hash",
    }