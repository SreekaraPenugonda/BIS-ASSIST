"""Generate simple demo PDFs (styled like standard summary sheets) so the repo
contains real PDF artifacts that the RAG ingest pipeline can process.

Usage:  python scripts/generate_sample_pdfs.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # backend root

from app.core.config import get_settings  # noqa: E402
from app.core.logging import configure_logging, get_logger  # noqa: E402
from app.data.sample_documents import SAMPLE_DOCUMENTS  # noqa: E402

logger = get_logger("gen_pdfs")


def main() -> None:
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
    except Exception as exc:  # pragma: no cover
        logger.warning("reportlab not installed — skipping PDF generation (%s)", exc)
        return

    out_dir = get_settings().documents_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("BISTitle", parent=styles["Title"], fontSize=16, leading=20, textColor=colors.HexColor("#0B3A82"))
    body_style = ParagraphStyle("BISBody", parent=styles["BodyText"], fontSize=10.5, leading=15)
    heading_style = ParagraphStyle("BISH", parent=styles["Heading2"], fontSize=12, spaceAfter=6, textColor=colors.HexColor("#0B3A82"))

    for doc in SAMPLE_DOCUMENTS:
        path = out_dir / f"{Path(doc['filename']).stem}.pdf"
        pdf = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm)

        def header_footer(canvas, _doc):
            canvas.saveState()
            canvas.setFont("Helvetica-Bold", 9)
            canvas.setFillColor(colors.HexColor("#B4532A"))
            canvas.drawString(18 * mm, 12 * mm, "INDIAN STANDARD — DEMO SUMMARY (not an official BIS document)")
            canvas.setFillColor(colors.HexColor("#0B3A82"))
            canvas.drawString(18 * mm, 810 * mm / 28.35 * 1.02, "Bureau of Indian Standards · AI Assistant demo")
            canvas.restoreState()

        story = [Paragraph(doc["title"], title_style), Spacer(1, 8)]
        for section in doc["sections"]:
            story.append(Paragraph(section["section"], heading_style))
            story.extend(Paragraph(p.strip(), body_style) for p in section["content"].split("\n\n"))
            story.append(Spacer(1, 6))
        pdf.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
        logger.info("Wrote %s", path)


if __name__ == "__main__":
    configure_logging()
    main()