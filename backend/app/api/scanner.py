from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.stats import stats
from app.schemas.scanner import ScanHistoryItem
from app.services.scanner_service import ALLOWED_IMAGE_TYPES, scanner_service

settings = get_settings()
router = APIRouter(prefix="/scanner", tags=["scanner"])

_EXT_MIME = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}


@router.post("/analyze", response_model=dict)
async def analyze(
    image: UploadFile = File(...),
    product_hint: str = Form(default=""),
):
    ext = (image.filename or "").rsplit(".", 1)[-1].lower() if image.filename else ""
    mime = image.content_type or _EXT_MIME.get(ext, "application/octet-stream")
    if mime not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Please upload a JPG, PNG or WebP image.",
        )
    max_bytes = settings.max_image_mb * 1024 * 1024
    data = await image.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Image too large. Maximum allowed size is {settings.max_image_mb} MB.",
        )
    if not data:
        raise HTTPException(status_code=400, detail="Empty image file uploaded.")

    result = scanner_service.analyze(data, mime, image.filename or "upload.jpg", product_hint.strip() or None)
    stats.record_scan(image.filename or "upload.jpg", result["mode"], result["status"])
    return result


@router.get("/history", response_model=list[ScanHistoryItem])
def history():
    return stats.recent_scans.list()