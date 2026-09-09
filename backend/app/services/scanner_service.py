"""Product scan orchestrator.

Safety rule (non-negotiable): the scanner NEVER verifies a product from an image
alone. The returned status is always VERIFICATION_REQUIRED; users are directed to
the official BIS portal. `verified` is always False.
"""
import re
from typing import Optional

from app.data.knowledge_base import DISCLAIMER
from app.services import recommendation_service, standards_service
from app.services.ocr_service import vision_service

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}

_FILENAME_CLEAN = re.compile(r"[\s\-_+]+")

# filename words -> (display product, category)
_HINT_MAP = {
    "kettle": ("Electric Kettle", "Electrical & Electronics"),
    "led": ("LED Bulb (A19)", "Lighting Products (LED)"),
    "bulb": ("LED Bulb (A19)", "Lighting Products (LED)"),
    "helmet": ("Safety Helmet", "Transportation & Safety"),
    "cement": ("Portland Cement Bag", "Construction & Cement"),
    "toy": ("Toy Car", "Toys & Child Safety"),
    "water": ("Packaged Drinking Water Bottle", "Drinking Water & Beverages"),
}


class ScannerService:
    def analyze(
        self,
        image_bytes: bytes,
        mime: str,
        filename: str,
        product_hint: Optional[str] = None,
    ) -> dict:
        vision = vision_service.analyze(image_bytes, mime, product_hint)
        if vision:
            return self._build_from_vision(vision, product_hint)
        return self._simulate(filename, product_hint)

    # ------------------------------------------------------------- AI path
    def _build_from_vision(self, vision: dict, product_hint: Optional[str]) -> dict:
        product_name = vision["product"]
        hint = product_hint or product_name
        rec = recommendation_service.recommend(product_name, hint)

        is_mark_detected = bool(vision.get("is_mark_detected"))
        license_number = vision.get("license_number")
        if is_mark_detected:
            confidence = 0.62 if license_number else 0.5
        else:
            confidence = 0.35
        labels = vision.get("is_numbers_on_label") or []
        standard = None
        for is_number in labels:
            std = standards_service.get_standard(is_number)
            if std:
                standard = self._standard_ref(std, "high")
                break
        if standard is None and rec["standards"]:
            top = rec["standards"][0]
            standard = {
                "is_number": top["is_number"],
                "title": top["title"],
                "relevance": top["relevance"],
                "status": top["status"],
            }

        message = (
            "Vision analysis detected the product and label details below. "
            "Detection of a BIS/ISI mark on packaging does NOT confirm a valid "
            "licence — always verify the licence number on the official BIS portal."
        )
        return {
            "status": "VERIFICATION_REQUIRED",
            "confidence": round(confidence, 2),
            "verified": False,
            "mode": "ai",
            "message": message,
            "product": {
                "name": product_name,
                "category": vision.get("category") or rec["category"],
                "brand": vision.get("brand"),
                "model": vision.get("model"),
            },
            "is_mark": {
                "detected": is_mark_detected,
                "text": vision.get("is_mark_text"),
            },
            "license_number": license_number,
            "standard": standard,
            "sources": [
                {
                    "document": f"{standard['is_number']} — {standard['title']}" if standard else rec["category"],
                    "page": None,
                    "section": "Scope",
                    "url": "https://www.bis.gov.in",
                }
            ],
            "disclaimer": DISCLAIMER,
        }

    # ------------------------------------------------------- simulation path
    def _simulate(self, filename: str, product_hint: Optional[str]) -> dict:
        words = _FILENAME_CLEAN.sub(" ", (filename or "")).lower().split()
        cleaned = " ".join(
            w for w in words if w not in {"label", "image", "photo", "img", "sample"}
        )
        product_name, category = self._guess_product(cleaned, product_hint)
        if product_hint and "unknown" not in str(product_hint).lower():
            product_name = str(product_hint).strip()[:120]
        rec = recommendation_service.recommend(product_name, category or "")
        top = rec["standards"][0] if rec["standards"] else None
        standard = (
            {
                "is_number": top["is_number"],
                "title": top["title"],
                "relevance": top["relevance"],
                "status": top["status"],
            }
            if top
            else None
        )
        return {
            "status": "VERIFICATION_REQUIRED",
            "confidence": 0.62,
            "verified": False,
            "mode": "simulation",
            "message": (
                "DEMO SIMULATION — no GEMINI_API_KEY is configured, so this result was "
                "derived deterministically from the file name. Connect a Gemini API key "
                "for real vision analysis of the BIS/ISI mark. Either way, a scanning "
                "result alone can never confirm certification."
            ),
            "product": {
                "name": product_name,
                "category": rec["category"],
                "brand": None,
                "model": None,
            },
            "is_mark": {
                "detected": True,
                "text": "BIS Standard Mark (simulated display)",
            },
            "license_number": None,
            "standard": standard,
            "sources": [
                {
                    "document": f"{standard['is_number']} — {standard['title']}"
                    if standard
                    else rec["category"],
                    "page": None,
                    "section": "Scope",
                    "url": "https://www.bis.gov.in",
                }
            ],
            "disclaimer": DISCLAIMER,
        }

    @staticmethod
    def _guess_product(cleaned_filename: str, hint: Optional[str]) -> tuple[str, str]:
        text = f"{cleaned_filename} {hint or ''}".lower()
        for word, (product, category) in _HINT_MAP.items():
            if word in text:
                return product, category
        if cleaned_filename and "unknown" not in cleaned_filename:
            return cleaned_filename.title()[:80], ""
        return "Product Label", "General / Other Products"

    @staticmethod
    def _standard_ref(std: dict, relevance: str) -> dict:
        return {
            "is_number": std["is_number"],
            "title": std["title"],
            "relevance": relevance,
            "status": std["status"],
        }


scanner_service = ScannerService()