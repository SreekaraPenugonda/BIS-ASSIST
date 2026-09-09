"""Token-bucket rate limiter keyed by client IP."""
import time
from collections import defaultdict, deque

from fastapi.responses import JSONResponse

from app.core.config import get_settings

EXEMPT_PREFIXES = ("/api/health", "/docs", "/redoc", "/openapi.json")


class RateLimitMiddleware:
    def __init__(self, app) -> None:
        self.app = app
        settings = get_settings()
        self.calls = max(settings.rate_limit_calls, 1)
        self.window = max(settings.rate_limit_window_seconds, 1)
        self._buckets: dict[str, deque] = defaultdict(deque)

    def _is_exempt(self, path: str) -> bool:
        return any(path.startswith(prefix) for prefix in EXEMPT_PREFIXES)

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http" or self._is_exempt(scope.get("path", "")):
            return await self.app(scope, receive, send)

        client = scope.get("client")
        ip = client[0] if client else "local"
        now = time.monotonic()

        bucket = self._buckets[ip]
        while bucket and now - bucket[0] > self.window:
            bucket.popleft()
        if len(bucket) >= self.calls:
            resp = JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please slow down and try again shortly.",
                    "retry_after_seconds": int(self.window),
                },
            )
            return await resp(scope, receive, send)

        bucket.append(now)
        return await self.app(scope, receive, send)