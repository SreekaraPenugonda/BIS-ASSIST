"""Embeddings: Gemini when available, else deterministic local hashing.

The local fallback builds a fixed-dimensional hashed bag-of-words vector that is
stable across restarts, so retrieval + cosine similarity behave consistently
even in fully-offline demo mode.
"""
import hashlib
import math
import re
from typing import Optional

import numpy as np

from app.core.config import get_settings

DIM = 256
_TOKEN_RE = re.compile(r"[^\W_]+", re.UNICODE)


def hash_embed(text: str, dim: int = DIM) -> np.ndarray:
    vector = np.zeros(dim, dtype=np.float32)
    tokens = _TOKEN_RE.findall(text.lower())
    for token in tokens:
        digest = hashlib.md5(token.encode("utf-8")).digest()
        idx = int.from_bytes(digest[:4], "little") % dim
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[idx] += sign
    norm = float(np.linalg.norm(vector))
    if norm > 0:
        vector = vector / norm
    return vector


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    na, nb = np.asarray(a, dtype=np.float32), np.asarray(b, dtype=np.float32)
    denom = float(np.linalg.norm(na) * np.linalg.norm(nb))
    if denom == 0:
        return 0.0
    return float(np.clip(float(np.dot(na, nb) / denom), 0.0, 1.0))


class EmbeddingService:
    def __init__(self) -> None:
        settings = get_settings()
        self.settings = settings
        self._client = None
        if settings.ai_configured:
            try:
                from google import genai  # type: ignore

                self._client = genai.Client(api_key=settings.gemini_api_key)
            except Exception:
                self._client = None

    @property
    def uses_gemini(self) -> bool:
        return self._client is not None

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if self._client is not None:
            try:
                resp = self._client.models.embed_content(
                    model=self.settings.gemini_embedding_model,
                    contents=texts[:64],
                )
                return [
                    list(item.values) if hasattr(item, "values") else []
                    for item in getattr(resp, "embeddings", [])
                ]
            except Exception:
                pass
        return [list(hash_embed(t)) for t in texts]

    def embed_one(self, text: str) -> list[float]:
        results = self.embed([text])
        return results[0] if results else list(hash_embed(text))


embedder = EmbeddingService()