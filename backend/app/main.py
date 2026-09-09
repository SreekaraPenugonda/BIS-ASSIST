from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api import admin, applications, auth, chat, health, scanner, standards
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.database import seed
from app.database.connection import init_db, SessionLocal
from app.middleware import (
    RateLimitMiddleware,
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
)
from app.services import rag_service
from app.data.sample_documents import SAMPLE_DOCUMENTS

settings = get_settings()
logger = get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(settings.environment.upper() == "DEVELOPMENT" and "DEBUG" or "INFO")
    init_db()

    db = SessionLocal()
    try:
        seeded = seed.seed_all(db)
        logger.info("Seeded db: %s", seeded)
    finally:
        db.close()

    rag_service.rag_index.clear()
    kb = rag_service.rag_index.load_knowledge_base()
    docs = rag_service.rag_index.load_sample_documents(SAMPLE_DOCUMENTS)
    embedded = rag_service.rag_index.embed()
    mode = "gemini" if rag_service.rag_index.uses_gemini else "local-hash"
    logger.info("RAG index ready: %s KB entries, %s doc sections (%s), mode=%s", kb, docs, embedded, mode)
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title=settings.app_name,
    description=(
        "AI-powered Indian Standards & BIS certification assistant — RAG over the "
        "BIS knowledge base with Gemini, product label scanning, MSME tools and "
        "admin analytics."
    ),
    version=__version__,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

_PREFIX = settings.api_prefix
app.include_router(health.router, prefix=_PREFIX)
app.include_router(auth.router, prefix=_PREFIX)
app.include_router(chat.router, prefix=_PREFIX)
app.include_router(scanner.router, prefix=_PREFIX)
app.include_router(standards.router, prefix=_PREFIX)
app.include_router(applications.router, prefix=_PREFIX)
app.include_router(admin.router, prefix=_PREFIX)


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "version": __version__,
        "docs": "/docs",
        "health": f"{_PREFIX}/health",
        "ai_mode": "configured" if settings.ai_configured else "simulation (no GEMINI_API_KEY)",
    }