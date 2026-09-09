"""Read access to the curated standards knowledge base (indiciative seed data)."""
from typing import Optional

from app.data import knowledge_base

STANDARD_DISCLAIMER = knowledge_base.DISCLAIMER


def all_standards() -> list[dict]:
    return list(knowledge_base.STANDARDS)


def categories() -> list[str]:
    return list(knowledge_base.CATEGORIES)


def get_standard(is_number: str) -> Optional[dict]:
    return knowledge_base.BY_NUMBER.get(is_number)


def search(query: str, category: Optional[str] = None, page: int = 1, size: int = 12) -> dict:
    query = knowledge_base.normalize_multilingual_query(query).strip().lower()
    items = knowledge_base.STANDARDS
    if category and category.lower() != "all":
        items = [
            s for s in items if s["product_category"].lower() == category.lower()
        ]
    if query:
        scored: list[tuple[int, int, dict]] = []
        for idx, std in enumerate(items):
            hay = " ".join(
                [
                    std["title"],
                    std["description"],
                    std["scope"],
                    std["keywords"],
                    std["is_number"],
                ]
            ).lower()
            score = 0
            for token in query.replace(",", " ").split():
                if len(token) < 2:
                    continue
                if token in hay:
                    score += 3
                elif token in std["product_category"].lower():
                    score += 1
            if score:
                scored.append((-score, idx, std))
        scored.sort(key=lambda t: (t[0], t[1]))
        items = [s[2] for s in scored]
    total = len(items)
    start = (page - 1) * size
    return {
        "items": items[start : start + size],
        "total": total,
        "categories": knowledge_base.CATEGORIES,
    }


def to_item_dict(std: dict) -> dict:
    return {
        "is_number": std["is_number"],
        "title": std["title"],
        "product_category": std["product_category"],
        "status": std["status"],
        "is_mandatory": std["is_mandatory"],
        "published_date": std["published_date"],
        "description": std["description"],
        "scope": std["scope"],
        "requirements": std["requirements"],
    }