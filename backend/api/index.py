"""Vercel Python entrypoint for the existing FastAPI application."""

import sys
from pathlib import Path

# Vercel runs this file as backend/api/index.py, so ``backend/`` (the parent
# of ``api/``) must be importable for ``from app.main import app`` to work.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.responses import JSONResponse

from app.main import app as fastapi_app

# Wrap with a defensive handler so Vercel logs show real tracebacks instead of
# an opaque 500 / 404 when an import-time dependency fails. CORS headers are
# attached here too, so even a hard crash still passes the browser preflight.
_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Requested-With, Accept, Origin",
    "Access-Control-Max-Age": "86400",
}


async def app(scope, receive, send):
    if scope.get("type") == "http" and scope.get("method", "").upper() == "OPTIONS":
        response = JSONResponse(status_code=200, content={"ok": True}, headers=_CORS_HEADERS)
        await response(scope, receive, send)
        return
    try:
        await fastapi_app(scope, receive, send)
    except Exception as exc:  # pragma: no cover - serverless diagnostics
        if scope.get("type") != "http":
            raise
        response = JSONResponse(
            status_code=500,
            content={"detail": f"Backend error: {type(exc).__name__}: {exc}"},
            headers={"Access-Control-Allow-Origin": "*"},
        )
        await response(scope, receive, send)

__all__ = ["app"]

