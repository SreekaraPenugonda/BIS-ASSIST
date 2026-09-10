"""Portable vector index over the knowledge base + indexed documents.

Retrieval combines cosine similarity (Gemini embeddings, or deterministic local
hashing when no API key) with a small keyword-reranking bonus, so citations stay
relevant and explainable in offline demo mode too.
"""
import math
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
        self._df: Optional[dict[str, int]] = None
        self._df_len: int = 0

    # ------------------------------------------------------------- population
    def clear(self) -> None:
        self.entries = []
        self.vectors = None
        self._df = None

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
            self._df = None
            return 0
        texts = [e["content"] for e in self.entries]
        try:
            vectors = embedding_service.embedder.embed(texts)
        except Exception:
            vectors = []
        # Keep vector[i] aligned with entry[i]: per-entry fallback on failure.
        if len(vectors) != len(texts):
            vectors = [[] for _ in texts]
        safe: list[list[float]] = []
        for text, vec in zip(texts, vectors):
            safe.append(list(vec) if vec else list(embedding_service.hash_embed(text)))
        self.vectors = np.asarray(safe, dtype=np.float32)
        norms = np.linalg.norm(self.vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.vectors = self.vectors / norms
        self._df = None
        return len(self.vectors)

    # ------------------------------------------------------------- retrieval
    def retrieve(self, query: str, k: int = 5) -> list[dict]:
        if not self.entries or self.vectors is None:
            return []
        normalized_query = normalize_multilingual_query(query or "")
        q = np.asarray(
            embedding_service.embedder.embed_one(normalized_query), dtype=np.float32
        )
        # A previously built index may use local 256-dim vectors while Gemini
        # now returns 3072-dim query embeddings. Keep retrieval available by
        # matching the query vector to the stored index dimension.
        if q.ndim != 1 or q.shape[0] != self.vectors.shape[1]:
            q = np.asarray(embedding_service.hash_embed(normalized_query), dtype=np.float32)
        q_norm = float(np.linalg.norm(q))
        if q_norm == 0:
            return []
        q = q / q_norm
        semantic = (self.vectors @ q).astype(np.float32)

        query_tokens = set(_TOKEN_RE.findall(normalized_query.lower()))
        n_docs = max(len(self.entries), 1)
        lexical = np.zeros(len(self.entries), dtype=np.float32)
        rare_bonus = np.zeros(len(self.entries), dtype=np.float32)
        if query_tokens:
            # Cache document frequencies across queries (rebuild if index changed).
            if self._df is None or self._df_len != len(self.entries):
                df: dict[str, int] = {}
                for entry in self.entries:
                    for tok in set(_TOKEN_RE.findall(entry["content"].lower())):
                        df[tok] = df.get(tok, 0) + 1
                self._df = df
                self._df_len = len(self.entries)
            df = self._df
            for i, entry in enumerate(self.entries):
                hay = set(_TOKEN_RE.findall(entry["content"].lower())) | set(
                    _TOKEN_RE.findall((entry.get("title") or "").lower())
                )
                overlap = query_tokens & hay
                if not overlap:
                    continue
                # BM25-lite: IDF-weighted overlap, saturating at 6.
                lexical[i] = min(
                    sum(math.log(1.0 + n_docs / (1 + df.get(t, 0))) for t in overlap),
                    6.0,
                )
                # Rare-term bonus: tokens in very few docs are strong signals.
                rare = [t for t in overlap if df.get(t, 0) <= max(2, n_docs // 25)]
                if rare:
                    rare_bonus[i] = 0.05 * len(rare)

        final = 0.60 * semantic + 0.28 * (lexical / 6.0) + rare_bonus
        order = np.argsort(-final)

        # MMR-style diversity: cap chunks per source document so context varies.
        results: list[dict] = []
        per_doc: dict[str, int] = {}
        for idx in order:
            entry = self.entries[int(idx)]
            doc = entry.get("document", "")
            if per_doc.get(doc, 0) >= 2:
                continue
            per_doc[doc] = per_doc.get(doc, 0) + 1
            results.append({**entry, "score": round(float(final[idx]), 4)})
            if len(results) >= k:
                break
        return results


rag_index = RagIndex()