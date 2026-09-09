"""Generate demo product-label images for the Scanner's "Try a sample" flow.

Writes PNGs to backend/data/samples and copies them into the frontend public
folder. The images are synthetic placeholders (clearly labelled as demo); they
are NOT official BIS/ISI artwork.

Usage:  python scripts/generate_sample_labels.py
"""
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # backend root

from app.core.config import get_settings  # noqa: E402
from app.core.logging import configure_logging, get_logger  # noqa: E402

logger = get_logger("gen_labels")

NAVY = (11, 58, 130, 255)
SAFFRON = (245, 158, 11, 255)
GREEN = (19, 136, 8, 255)
WHITE = (255, 255, 255, 255)
GREY = (245, 247, 250, 255)


def _rounded(draw, xy, radius, fill):
    from PIL import Image, ImageDraw

    img = Image.new("RGBA", (2000, 2400), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(xy, radius=radius, fill=fill)
    draw.alpha_composite(img)


def _isi_mark(draw, cx, cy, r):
    """Very simplified BIS-style circular mark placeholder; reads 'ISI'."""
    from PIL import Image, ImageDraw, ImageFont

    draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=NAVY, width=14)
    draw.ellipse((cx - int(r * 0.62), cy - int(r * 0.62), cx + int(r * 0.62), cy + int(r * 0.62)), outline=SAFFRON, width=8)
    font = ImageFont.load_default(28)
    draw.text((cx - 26, cy - 18), "ISI", fill=NAVY, font=font)


def _label(title, subtitle, lines, out_path: Path, license_no, is_number):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except Exception as exc:  # pragma: no cover
        logger.warning("Pillow not available — skipping sample labels (%s)", exc)
        return False

    W, H = 2000, 2400
    img = Image.new("RGBA", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, 170), fill=NAVY)
    d.text((60, 40), "GOVT OF INDIA  |  BIS STANDARD MARK  |  DEMO LABEL", fill=(255, 255, 255, 255))
    d.rectangle((0, H - 170, W, H), fill=SAFFRON)

    d.text((W // 2 - 260, 260), title, fill=NAVY)
    d.text((W // 2 - 260, 460), subtitle, fill=(70, 80, 110, 255))
    y = 720
    for line in lines:
        d.text((W // 2 - 260, y), line, fill=(30, 40, 60, 255))
        y += 120
    if license_no:
        d.text((W // 2 - 260, y + 40), f"BIS LICENCE NO: {license_no}", fill=GREEN)
    if is_number:
        d.text((W // 2 - 260, y + 160), f"Conforms to {is_number} (indicative demo)", fill=NAVY)

    _isi_mark(d, 1620, 1150, 220)
    d.text((1495, 1420), "ISI MARK", fill=NAVY)
    d.text((140, 2100), "DEMO SAMPLE — GENERATED FOR THE HACKATHON UI. Not a real product label.", fill=(150, 30, 30, 255))

    img.convert("RGB").save(out_path, "PNG")
    return True


LABELS = [
    {
        "file": "electric_kettle_label.png",
        "title": "VOLTHOME ELECTRIC KETTLE",
        "subtitle": "Model EK-1750  •  1.75 L  •  220 V  •  1500 W",
        "lines": ["Stainless steel body  •  Auto shut-off on boil", "BPA-free spout  •  Overheat protection", "MRP Rs 899  (incl. of all taxes)"],
        "license": "CM/L-10000234",
        "is_number": "IS 302 (Part 2-15):2018",
    },
    {
        "file": "led_bulb_label.png",
        "title": "LUMISYS LED BULB  A19",
        "subtitle": "9 W  •  850 lm  •  220-240 V AC  •  Warm White",
        "lines": ["Life: 25,000 hours  •  2-year warranty", "High power factor  •  Flicker-free", "MRP Rs 149  (incl. of all taxes)"],
        "license": "CM/L-8723451",
        "is_number": "IS 16102:2013",
    },
    {
        "file": "helmet_label.png",
        "title": "RIDERSAFE PROTECTIVE HELMET",
        "subtitle": "IS 4151:2015  •  ISI Certified (demo)  •  M 55-58 cm",
        "lines": ["ABS shell  • EPP impact liner", "Retention strap with double-D ring", "Ventilated  •  Weighs 1380 g"],
        "license": "CM/L-5566001",
        "is_number": "IS 4151:2015",
    },
]


def main() -> None:
    settings = get_settings()
    out_dir = settings.data_dir / "samples"
    out_dir.mkdir(parents=True, exist_ok=True)
    frontend_samples = settings.data_dir.parent / "frontend" / "public" / "samples"
    created = 0
    for spec in LABELS:
        path = out_dir / spec["file"]
        if _label(
            spec["title"], spec["subtitle"], spec["lines"], path,
            spec["license"], spec["is_number"],
        ):
            created += 1
            if frontend_samples.exists():
                shutil.copyfile(path, frontend_samples / spec["file"])
    logger.info("Generated %s sample label images in %s", created, out_dir)


if __name__ == "__main__":
    configure_logging()
    main()