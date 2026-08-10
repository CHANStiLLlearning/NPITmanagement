from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.schemas.user import User, UserCreate, UserUpdate
from app.crud.user import create_user, get_user_by_email, get_users, get_user, update_user, delete_user
from app.api.deps import get_current_active_superuser, get_current_active_user
from fastapi import Request
from app.crud.audit_log import log_action
import os, uuid

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_IMAGE_EXTS = {"png", "jpg", "jpeg", "webp", "gif"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB

def _save_avatar(file_bytes: bytes, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(status_code=400, detail=f"Invalid image type. Allowed: {', '.join(ALLOWED_IMAGE_EXTS)}")
    if len(file_bytes) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=400, detail="Image exceeds 5 MB limit.")
    unique_name = f"avatar_{uuid.uuid4().hex[:10]}.{ext}"
    with open(os.path.join(UPLOAD_DIR, unique_name), "wb") as f:
        f.write(file_bytes)
    return f"/static/uploads/{unique_name}"

@router.post("/me/avatar", response_model=User)
async def upload_my_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload profile photo for the currently logged-in user (any role)."""
    content = await file.read()
    photo_url = _save_avatar(content, file.filename)
    db_user = get_user(db, user_id=current_user.id)
    db_user.photo_url = photo_url
    
    # Sync with Student record if applicable
    from app.models.student import Student
    st = db.query(Student).filter(Student.email == current_user.email).first()
    if st:
        st.photo_url = photo_url

    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/{user_id}/avatar", response_model=User)
async def upload_user_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """Upload profile photo for any user (Super Admin only)."""
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    content = await file.read()
    photo_url = _save_avatar(content, file.filename)
    db_user.photo_url = photo_url
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
def register_user(
    request: Request,
    user_in: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Create new user (Super Admin only).
    """
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = create_user(db, user_in)
    log_action(
        db,
        user_email=current_user.email,
        action="create",
        module="Users",
        details=f"Created user {user.email} ({user.role})",
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    return user

@router.get("/", response_model=List[User])
def read_users(
    skip: int = Query(0, ge=0, description="Pagination skip offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination page size limit"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    search: Optional[str] = Query(None, description="Search query string"),
    sort_by: Optional[str] = Query("id", description="Field to sort by"),
    order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Retrieve users with Pagination, Filtering, Searching, and Sorting (Super Admin only).
    """
    users = get_users(db, skip=skip, limit=limit, role=role, search=search, sort_by=sort_by, order=order)
    return users

@router.get("/me", response_model=User)
def read_users_me(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current active user profile.
    """
    return current_user

@router.get("/{user_id}", response_model=User)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Get a specific user by ID (Super Admin only).
    """
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=User)
def update_user_by_id(
    request: Request,
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Update a user (Super Admin only).
    """
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = update_user(db, db_user=user, user=user_in)
    log_action(
        db,
        user_email=current_user.email,
        action="update",
        module="Users",
        details=f"Updated user ID {user.id} ({user.email})",
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    return user

@router.delete("/{user_id}", response_model=User)
def delete_user_by_id(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    Delete a user (Super Admin only).
    """
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Super admin cannot delete their own active session account.")
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = delete_user(db, db_user=user)
    log_action(
        db,
        user_email=current_user.email,
        action="delete",
        module="Users",
        details=f"Deleted user ID {user.id} ({user.email})",
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    return user
