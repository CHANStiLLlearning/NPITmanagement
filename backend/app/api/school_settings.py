import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, RoleEnum
from app.models.school_setting import SchoolSetting
from app.schemas.school_setting import SchoolSettingOut, SchoolSettingUpdate
from app.api.deps import get_current_active_user
from app.crud.audit_log import log_action

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_IMAGE_EXTS = {"png", "jpg", "jpeg", "webp", "svg", "gif"}
MAX_ASSET_SIZE = 10 * 1024 * 1024  # 10 MB


def get_or_create_settings(db: Session) -> SchoolSetting:
    setting = db.query(SchoolSetting).first()
    if not setting:
        setting = SchoolSetting()
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


@router.get("/", response_model=SchoolSettingOut)
def get_school_settings(db: Session = Depends(get_db)):
    """Retrieve the current school / institute configuration settings."""
    return get_or_create_settings(db)


@router.put("/", response_model=SchoolSettingOut)
def update_school_settings(
    settings_in: SchoolSettingUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update institutional settings (Super Admin and Admin only)."""
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Administrators can update school settings."
        )

    setting = get_or_create_settings(db)
    update_data = settings_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(setting, field, value)

    db.commit()
    db.refresh(setting)

    # Log to audit trail
    client_ip = request.client.host if request and request.client else "127.0.0.1"
    user_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email
    log_action(
        db,
        user_email=current_user.email,
        user_name=user_name,
        action="update",
        module="SchoolSettings",
        details=f"Updated institution profile and academic configuration",
        ip_address=client_ip
    )

    return setting


@router.post("/upload-asset")
async def upload_setting_asset(
    file: UploadFile = File(...),
    asset_type: str = "logo",  # "logo", "stamp", or "signature"
    current_user: User = Depends(get_current_active_user),
):
    """Upload official branding asset (Logo, Stamp, Principal Signature)."""
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Administrators can upload school branding assets."
        )

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '.{ext}'. Allowed types: {', '.join(ALLOWED_IMAGE_EXTS)}"
        )

    content = await file.read()
    if len(content) > MAX_ASSET_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Asset size exceeds 10MB limit."
        )

    unique_filename = f"school_{asset_type}_{uuid.uuid4().hex[:8]}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "url": f"/static/uploads/{unique_filename}",
        "filename": unique_filename,
        "asset_type": asset_type
    }


@router.post("/reset", response_model=SchoolSettingOut)
def reset_school_settings(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Reset institution profile back to original NPIT defaults."""
    if current_user.role != RoleEnum.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admin can reset school settings to default."
        )

    db.query(SchoolSetting).delete()
    db.commit()

    setting = SchoolSetting()
    db.add(setting)
    db.commit()
    db.refresh(setting)

    client_ip = request.client.host if request and request.client else "127.0.0.1"
    user_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email
    log_action(
        db,
        user_email=current_user.email,
        user_name=user_name,
        action="reset",
        module="SchoolSettings",
        details="Reset school settings to default NPIT profile",
        ip_address=client_ip
    )

    return setting
