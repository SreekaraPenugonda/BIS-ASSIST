"""PDF extraection (PyMuPDF) and text chunking for the RAG pipeline."""
from typing import Optional

from app.core.logging import get_logger

logger = get_logger("pdf")

try:
    import fitz  # PyMuPDF

    _FITZ = True
except Exception:  # pragma: no cover
    fitz = None
    _FITZ = False


def extract_pdf_pages(data: bytes) -> list[str]:
    """Return one string per page. Raises ValueError for invalid input."""
    if not _FITZ:
        raise ValueError("PyMuPDF is not installed; cannot extract PDF text.")
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:  # pragma: no cover
        raise ValueError("Uploaded file is not a readable PDF.") from exc
    pages: list[str] = []
    try:
        for page in doc:
            pages.append(page.get_text("text") or "")
    finally:
        doc.close()
    if not pages or all(not p.strip() for p in pages):
        raise ValueError("No extractable text found in the PDF (scanned image PDFs need OCR).")
    return pages


def chunk_pages(pages: list[str], chunk_size: int = 1000, overlap: int = 120) -> list[dict]:
    """Split page text into overlapping windowed chunks."""
    chunks: list[dict] = []
    for page_idx, page_text in enumerate(pages, start=1):
        text = " ".join(page_text.split())
        start = 0
        n = len(text)
        while start < n:
            end = start + chunk_size
            piece = text[start:end].strip()
            if piece:
                chunks.append(
                    {
                        "page_number": page_idx,
                        "section": _guess_section(page_text, piece),
                        "content": piece,
                    }
                )
            if end >= n:
                break
            start = end - overlap
    return chunks


def _guess_section(page_text: str, piece: str) -> str:
    """Best-effort section name from the first non-empty line near the chunk."""
    for line in page_text.splitlines()[:12]:
        line = line.strip()
        if 3 <= len(line) <= 80 and not line.endswith(".") and not line.endswith(":  "):
            return line
    first_word = (piece.split() or ["Section"])[0]
    return f"{first_word}…" if len(first_word) < 40 else "Section"