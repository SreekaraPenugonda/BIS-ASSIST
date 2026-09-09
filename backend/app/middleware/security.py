"""Response security headers middleware."""
from typing import Callable

DEFAULT_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(self), microphone=()",
    "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'; base-uri 'self'",
}


class SecurityHeadersMiddleware:
    def __init__(self, app: Callable) -> None:
        self.app = app

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = message.get("headers") or []
                combined = dict(headers)
                combined.update(
                    (k.lower().encode(), v.encode()) for k, v in DEFAULT_HEADERS.items()
                )
                message["headers"] = list(combined.items())
            await send(message)

        await self.app(scope, receive, send_wrapper)