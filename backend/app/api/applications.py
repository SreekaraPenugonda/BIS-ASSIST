from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_optional_user, require_admin
from app.core.security import generate_app_number
from app.core.stats import stats
from app.database.connection import get_db
from app.models.application import APPLICATION_STATUSES, Application
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationOut, StatusUpdate

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationOut, status_code=201)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in ("msme", "admin"):
        raise HTTPException(status_code=403, detail="Only MSME accounts can submit certification applications.")
    app_row = Application(
        application_number=generate_app_number(),
        user_id=user.id,
        product_name=payload.product_name.strip(),
        category=payload.category.strip(),
        is_number=payload.is_number.strip(),
        standard_title=payload.standard_title.strip(),
        notes=payload.notes or "",
    )
    db.add(app_row)
    db.commit()
    db.refresh(app_row)
    stats.increment("applications")
    return _to_out(app_row)


@router.get("", response_model=list[ApplicationOut])
def list_applications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Application).order_by(Application.submitted_at.desc())
    if user.role != "admin":
        q = q.filter(Application.user_id == user.id)
    return [_to_out(a) for a in q.all()]


@router.get("/{application_number}", response_model=ApplicationOut)
def get_application(
    application_number: str,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    app_row = db.query(Application).filter(Application.application_number == application_number.upper()).first()
    if app_row is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    if user is None or (user.role != "admin" and app_row.user_id != user.id):
        raise HTTPException(status_code=403, detail="This application belongs to another account.")
    return _to_out(app_row)


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_status(
    application_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    app_row = db.get(Application, application_id)
    if app_row is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    if payload.status not in APPLICATION_STATUSES:
        raise HTTPException(status_code=422, detail=f"Invalid status. Allowed: {', '.join(APPLICATION_STATUSES)}")
    app_row.status = payload.status
    db.commit()
    db.refresh(app_row)
    return _to_out(app_row)


def _to_out(app_row: Application) -> ApplicationOut:
    return ApplicationOut(
        id=app_row.id,
        application_number=app_row.application_number,
        user_id=app_row.user_id,
        product_name=app_row.product_name,
        category=app_row.category,
        is_number=app_row.is_number,
        standard_title=app_row.standard_title,
        status=app_row.status,
        notes=app_row.notes or "",
        submitted_at=app_row.submitted_at,
        updated_at=app_row.updated_at,
    )