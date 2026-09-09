"""Product-label visual analysis via Gemini Vision (optional)."""
from typing import Optional

from app.services.gemini_service import gemini

VISION_PROMPT = """You are the vision engine of a BIS product-scan assistant.
Analyse the uploaded product label photograph. Respond with STRICT JSON only:

{
  "product": "short product name, e.g. Electric Kettle",
  "category": "product category guess",
  "brand": "brand if readable, else null",
  "model": "model number if readable, else null",
  "is_mark_detected": true/false,
  "is_mark_text": "exact text near the BIS/ISI mark if visible, else null",
  "license_number": "7 or 8 character licence number like CM/L-1234567 if readable, else null",
  "is_numbers_on_label": ["IS 302 (Part 2-1):2017" style strings seen on the label],
  "description": "one sentence describing what the product is",
  "warnings": ["any safety warnings present on the label"]
}

Rules:
- Detect the BIS Standard Mark (ISI) visual mark carefully: it contains the words
  'bis' and an Ashoka-chakra-like motif. If the standard mark is NOT unambiguously
  visible, set is_mark_detected=false.
- If unsure, leave fields null. Do NOT invent licence numbers."""


class VisionService:
    def analyze(self, image_bytes: bytes, mime: str, product_hint: Optional[str] = None) -> Optional[dict]:
        if not gemini.available:
            return None
        prompt = VISION_PROMPT
        if product_hint:
            prompt += f"\nThe user says the product is: {product_hint}"
        result = gemini.analyze_image(image_bytes, mime, prompt)
        if not result or not isinstance(result, dict):
            return None
        return _normalize(result)


def _normalize(data: dict) -> dict:
    def _txt(*keys: str) -> Optional[str]:
        for key in keys:
            value = data.get(key)
            if isinstance(value, str) and value.strip() and value.strip().lower() not in ("null", "none", "n/a"):
                return value.strip()[:180]
        return None

    product = _txt("product")
    return {
        "product": product or "Unknown product",
        "category": _txt("category"),
        "brand": _txt("brand"),
        "model": _txt("model"),
        "is_mark_detected": bool(data.get("is_mark_detected")),
        "is_mark_text": _txt("is_mark_text"),
        "license_number": _txt("license_number"),
        "is_numbers_on_label": data.get("is_numbers_on_label") or [],
        "description": _txt("description"),
        "warnings": data.get("warnings") or [],
    }


vision_service = VisionService()