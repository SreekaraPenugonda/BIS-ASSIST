"""Password hashing (bcrypt w/ stdlib PBKDF2 fallback) and JWT helpers."""
import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt as pyjwt

from app.core.config import get_settings

try:  # bcrypt is preferred; fall back to pure-stdlib PBKDF2 if unavailable
    import bcrypt as _bcrypt

    _HAS_BCRYPT = True
except Exception:  # pragma: no cover - import guard
    _bcrypt = None
    _HAS_BCRYPT = False

_PBKDF2_ITERATIONS = 300_000


def hash_password(password: str) -> str:
    """Return a self-describing password hash string."""
    if _HAS_BCRYPT:
        salt = _bcrypt.gensalt(rounds=12)
        return _bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS
    )
    return (
        f"$pbkdf2-sha256${_PBKDF2_ITERATIONS}${base64.b64encode(salt).decode()}"
        f"${base64.b64encode(digest).decode()}"
    )


def verify_password(password: str, password_hash: str) -> bool:
    if not password or not password_hash:
        return False
    try:
        if password_hash.startswith("$2"):  # bcrypt
            if not _HAS_BCRYPT:
                return False
            return _bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
        if password_hash.startswith("$pbkdf2-sha256$"):
            _, _, iterations_b64, salt_b64, digest_b64 = password_hash.split("$", 4)
            salt = base64.b64decode(salt_b64)
            expected = base64.b64decode(digest_b64)
            actual = hashlib.pbkdf2_hmac(
                "sha256", password.encode("utf-8"), salt, int(iterations_b64)
            )
            return hmac.compare_digest(actual, expected)
    except Exception:
        return False
    return False


def create_access_token(subject: str, role: str, expires_minutes: Optional[int] = None) -> str:
    settings = get_settings()
    minutes = expires_minutes or settings.access_token_expire_minutes
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=minutes),
    }
    return pyjwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[dict[str, Any]]:
    settings = get_settings()
    try:
        return pyjwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except Exception:
        return None


def generate_app_number() -> str:
    """BIS-style application reference, e.g. BIS-2026-482913."""
    year = datetime.now(timezone.utc).year
    return f"BIS-{year}-{secrets.randbelow(900000) + 100000}"