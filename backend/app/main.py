from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

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
    _warm_rag_index()
    yield
    logger.info("Shutting down.")


def _warm_rag_index() -> None:
    """Seed DB + build the in-memory RAG index (safe to call more than once)."""
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


# Vercel serverless functions do not always run lifespan handlers, so warm the
# index eagerly at import time too. _warm_rag_index is idempotent.
try:
    _warm_rag_index()
except Exception as exc:  # pragma: no cover - never break import on serverless
    logger.warning("RAG warm-up deferred: %s", exc)


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

# ---------------------------------------------------------------------------
# First-party CORS handler (replaces CORSMiddleware).
# CORSMiddleware answers OPTIONS internally *without* calling downstream
# middleware, and Vercel's Python runtime can strip/mangle those headers on
# error paths. Handling OPTIONS + injecting headers explicitly at the very
# outside guarantees the browser always sees Access-Control-Allow-Origin.
# ---------------------------------------------------------------------------
CORS_ALLOW_ORIGIN = "*"
CORS_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
CORS_ALLOW_HEADERS = "Authorization, Content-Type, X-Requested-With, Accept, Origin"
CORS_MAX_AGE = "86400"


class _CorsMiddleware:
    def __init__(self, app) -> None:
        self.app = app

    async def __call__(self, scope, receive, send) -> None:
        if scope.get("type") != "http":
            return await self.app(scope, receive, send)

        if scope.get("method", "").upper() == "OPTIONS":
            response = JSONResponse(status_code=200, content={"ok": True})
            raw = [(k.lower().encode(), v.encode()) for k, v in response.headers.items()]
            raw.append((b"access-control-allow-origin", CORS_ALLOW_ORIGIN.encode()))
            raw.append((b"access-control-allow-methods", CORS_ALLOW_METHODS.encode()))
            raw.append((b"access-control-allow-headers", CORS_ALLOW_HEADERS.encode()))
            raw.append((b"access-control-max-age", CORS_MAX_AGE.encode()))
            await send({"type": "http.response.start", "status": 200, "headers": raw})
            await send({"type": "http.response.body", "body": b'{"ok": true}'})
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers") or [])
                lower = {k.lower() for k, _ in headers}
                if b"access-control-allow-origin" not in lower:
                    headers.append((b"access-control-allow-origin", b"*"))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)


# NOTE: Starlette runs the LAST-added middleware FIRST (outermost). CORS must
# be the outermost layer so preflights never hit rate-limit / auth logic.
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(_CorsMiddleware)

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