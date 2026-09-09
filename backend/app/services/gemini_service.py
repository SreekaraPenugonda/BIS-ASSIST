"""Gemini wrapper (google-genai SDK) with graceful simulation fallback.

Every public method is safe to call without an API key — `available` is False,
and chat/scanner services transparently switch to their simulation paths.
"""
import json
import re
from typing import Any, Iterator, Optional

from app.core.config import get_settings


class GeminiService:
    def __init__(self) -> None:
        settings = get_settings()
        self.settings = settings
        self.model = settings.gemini_model
        self.available = False
        self._client = None
        if settings.ai_configured:
            try:
                from google import genai  # type: ignore

                self._client = genai.Client(api_key=settings.gemini_api_key)
                self.available = True
            except Exception:
                self._client = None

    # ------------------------------------------------------------------ text
    def generate(self, system: str, user: str) -> str:
        if not self.available or self._client is None:
            return ""
        try:
            from google.genai import types  # type: ignore

            resp = self._client.models.generate_content(
                model=self.model,
                contents=user,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    temperature=0.3,
                    max_output_tokens=1024,
                ),
            )
            return (resp.text or "").strip()
        except Exception:
            return ""

    def generate_stream(self, system: str, user: str) -> Iterator[str]:
        if not self.available or self._client is None:
            return
        try:
            from google.genai import types  # type: ignore

            stream = self._client.models.generate_content_stream(
                model=self.model,
                contents=user,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    temperature=0.3,
                    max_output_tokens=1024,
                ),
            )
            for chunk in stream:
                piece = (getattr(chunk, "text", None) or "").strip()
                if piece:
                    yield piece
        except Exception:
            return

    # ----------------------------------------------------------------- image
    def analyze_image(self, image_bytes: bytes, mime: str, prompt: str) -> Optional[dict]:
        if not self.available or self._client is None:
            return None
        try:
            from google.genai import types  # type: ignore

            part = types.Part.from_bytes(data=image_bytes, mime_type=mime)
            resp = self._client.models.generate_content(
                model=self.model,
                contents=[part, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                    max_output_tokens=1024,
                ),
            )
            return _extract_json(resp.text or "")
        except Exception:
            return None


def _extract_json(text: str) -> Optional[dict]:
    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    return None


gemini = GeminiService()