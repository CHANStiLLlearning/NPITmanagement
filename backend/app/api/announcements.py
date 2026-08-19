from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, RoleEnum
from app.models.communication import Announcement
from pydantic import BaseModel

router = APIRouter()

class AnnouncementCreate(BaseModel):
    title: str
    message: str
    target_audience: str = "all"  # all, student, staff, parent
    priority: str = "normal"      # normal, urgent, high

@router.get("/")
def list_announcements(
    target: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve announcements visible to current user."""
    q = db.query(Announcement).filter(Announcement.is_published == True)
    if target:
        q = q.filter(Announcement.target_audience.in_(["all", target]))
    return q.order_by(Announcement.published_at.desc()).all()

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Post school announcement (Admins & Staff)."""
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.admin, RoleEnum.teacher]:
        raise HTTPException(status_code=403, detail="Permission denied.")

    ann = Announcement(
        title=payload.title,
        message=payload.message,
        target_audience=payload.target_audience,
        priority=payload.priority,
        author_name=f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email,
        is_published=True,
        published_at=datetime.utcnow()
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann

@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Permission denied.")
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found.")
    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted successfully"}
