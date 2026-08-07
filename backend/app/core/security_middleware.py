import time
import html
from collections import defaultdict
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies production HTTP Security Headers for HTTPS, XSS, Clickjacking, and CSP protection.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)

        # HTTPS / HSTS (HTTP Strict Transport Security)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Clickjacking Protection
        response.headers["X-Frame-Options"] = "DENY"

        # MIME Sniffing Protection
        response.headers["X-Content-Type-Options"] = "nosniff"

        # XSS Protection Filter
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Content Security Policy (CSP)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: blob:; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline';"
        )

        return response


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    In-memory Sliding Window Rate Limiter to prevent Brute-Force & Denial of Service (DoS).
    - Login / Auth endpoints: Max 15 requests per minute per IP.
    - General API endpoints: Max 200 requests per minute per IP.
    """
    def __init__(self, app):
        super().__init__(app)
        # ip -> list of timestamps
        self.requests: Dict[str, List[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next) -> Response:
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        window_seconds = 60.0

        # Define limits for sensitive endpoints
        is_auth = request.url.path.startswith(("/auth/", "/api/v1/auth/"))
        max_allowed = 10 if is_auth else 200

        # Clean old timestamps outside the window
        self.requests[client_ip] = [
            ts for ts in self.requests[client_ip] if now - ts < window_seconds
        ]

        if len(self.requests[client_ip]) >= max_allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Rate limit exceeded. Please wait a minute before trying again."
                },
                headers={"Retry-After": "60"}
            )

        self.requests[client_ip].append(now)
        return await call_next(request)


def sanitize_xss(text: str) -> str:
    """Sanitize input string against XSS (Cross-Site Scripting) injection."""
    if not text:
        return text
    return html.escape(text.strip())
