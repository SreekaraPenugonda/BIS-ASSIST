"""Request logging + activity tracking + request-id header."""
import time
import uuid

from app.core.logging import get_logger
from app.core.stats import stats

logger = get_logger("http")


class RequestLoggingMiddleware:
    def __init__(self, app) -> None:
        self.app = app

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        path = scope.get("path", "")
        method = scope.get("method", "GET")
        request_id = uuid.uuid4().hex[:12]
        started = time.perf_counter()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers") or [])
                headers.append((b"x-request-id", request_id.encode()))
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration_ms = (time.perf_counter() - started) * 1000
        # Activity counters used by the dashboard
        if path == "/api/chat" or path == "/api/chat/stream":
            stats.increment("queries_today")  # dedup'd with chat_service.record_query
        if path == "/api/auth/login":
            stats.increment("logins")
        logger.info("%s %s -> %.0fms", method, path, duration_ms)