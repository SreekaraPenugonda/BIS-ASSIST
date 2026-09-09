"""Portable vector index over the knowledge base + indexed documents.

Retrieval combines cosine similarity (Gemini embeddings, or deterministic local
hashing when no API key) with a small keyword-reranking bonus, so citations stay
relevant and explainable in offline demo mode too.
"""
import re
from typing import Optional

import numpy as np

from app.core.logging import get_logger
from app.data.knowledge_base import normalize_multilingual_query
from app.services import embedding_service, standards_service

logger = get_logger("rag")
_TOKEN_RE = re.compile(r"[^\W_]+", re.UNICODE)

_WATER_URL = "https://www.bis.gov.in"


class RagIndex:
    def __init__(self) -> None:
        self.entries: list[dict] = []
        self.vectors: Optional[np.ndarray] = None
        self.uses_gemini = embedding_service.embedder.uses_gemini

    # ------------------------------------------------------------- population
    def clear(self) -> None:
        self.entries = []
        self.vectors = None

    def add_entry(
        self,
        *,
        document: str,
        content: str,
        page: Optional[int] = None,
        section: Optional[str] = None,
        url: Optional[str] = None,
        is_number: Optional[str] = None,
        title: Optional[str] = None,
    ) -> None:
        self.entries.append(
            {
                "document": document,
                "content": content,
                "page": page,
                "section": section,
                "url": url,
                "is_number": is_number,
                "title": title,
            }
        )

    def load_knowledge_base(self) -> int:
        count = 0
        for std in standards_service.all_standards():
            content = " ".join(
                [
                    std["is_number"],
                    std["title"],
                    std["description"],
                    std["scope"],
                    " ".join(std["requirements"]),
                    std["keywords"],
                ]
            )
            self.add_entry(
                document=f"{std['is_number']} — {std['title'][:70]}",
                content=content,
                section="Scope & Requirements",
                url=_WATER_URL,
                is_number=std["is_number"],
                title=std["title"],
            )
            count += 1
        return count

    def load_sample_documents(self, sample_documents: list[dict]) -> int:
        count = 0
        for doc in sample_documents:
            for section in doc["sections"]:
                self.add_entry(
                    document=doc["filename"],
                    content=section["content"],
                    page=section.get("page"),
                    section=section.get("section", ""),
                    url=_WATER_URL,
                )
                count += 1
        return count

    def embed(self) -> int:
        if not self.entries:
            self.vectors = None
            return 0
        texts = [e["content"] for e in self.entries]
        vectors = embedding_service.embedder.embed(texts)
        vectors = [v for v in vectors if v]
        if not vectors:
            vectors = [list(embedding_service.hash_embed(t)) for t in texts]
        self.vectors = np.asarray(vectors, dtype=np.float32)
        norms = np.linalg.norm(self.vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.vectors = self.vectors / norms
        return len(self.vectors)

    # ------------------------------------------------------------- retrieval
    def retrieve(self, query: str, k: int = 5) -> list[dict]:
        if not self.entries or self.vectors is None:
            return []
        normalized_query = normalize_multilingual_query(query or "")
        q = np.asarray(
            embedding_service.embedder.embed_one(normalized_query), dtype=np.float32
        )
        q_norm = float(np.linalg.norm(q))
        if q_norm == 0:
            return []
        q = q / q_norm
        scores = (self.vectors @ q).astype(np.float32)

        query_tokens = set(_TOKEN_RE.findall(normalized_query.lower()))
        bonus = np.zeros(len(self.entries), dtype=np.float32)
        if query_tokens:
            for i, entry in enumerate(self.entries):
                hay_tokens = set(_TOKEN_RE.findall(entry["content"].lower())) | set(
                    _TOKEN_RE.findall((entry.get("title") or "").lower())
                )
                overlap = len(query_tokens & hay_tokens)
                if overlap:
                    bonus[i] = min(overlap, 4) * 0.035

        final = scores + bonus
        order = np.argsort(-final)[:k]
        results: list[dict] = []
        for idx in order:
            entry = self.entries[int(idx)]
            results.append(
                {
                    **entry,
                    "score": round(float(final[idx]), 4),
                }
            )
        return results


rag_index = RagIndex()