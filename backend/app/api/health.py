import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import __version__
from app.core.config import get_settings
from app.database.connection import get_db, init_db
from app.models import document as doc_models
from app.models import standard as std_models
from app.models import user as user_models
from app.services.gemini_service import gemini
from app.services.rag_service import rag_index

settings = get_settings()
router = APIRouter(tags=["health"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    started = datetime.now(timezone.utc)
    try:
        init_db()
        db_status = "ok"
    except Exception as exc:  # pragma: no cover
        db_status = f"error: {exc}"
    counts = {
        "users": db.query(func.count(user_models.User.id)).scalar() or 0,
        "standards": db.query(func.count(std_models.Standard.id)).scalar() or 0,
        "documents": db.query(func.count(doc_models.Document.id)).scalar() or 0,
        "chunks": db.query(func.count(doc_models.DocumentChunk.id)).scalar() or 0,
    }
    return {
        "status": "ok",
        "version": __version__,
        "environment": settings.environment,
        "uptime_seconds": int(time.time() - started.timestamp()),
        "services": {
            "database": db_status,
            "ai_engine": "configured" if gemini.available else "simulation",
            "rag": f"{len(rag_index.entries)} entries indexed",
        },
        "counts": counts,
    }