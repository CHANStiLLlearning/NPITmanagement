from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.teaching_report import (
    TeachingReportCreate, TeachingReportUpdate,
    TeachingReportOut, ApprovalRequest,
)
from app.crud.teaching_report import (
    create_report, get_report, get_reports,
    update_report, submit_report, review_report, delete_report,
)
from app.api.deps import get_current_active_user
from app.models.user import User, RoleEnum
from app.models.teaching_report import TeachingReport

router = APIRouter()

REVIEWER_ROLES = {RoleEnum.super_admin, RoleEnum.admin, RoleEnum.principal}


@router.get("/", response_model=List[TeachingReportOut])
def list_reports(
    status: Optional[str] = None,
    class_name: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Teachers only see their own; admins/principals see all
    teacher_email = None
    if current_user.role == RoleEnum.teacher:
        teacher_email = current_user.email

    return get_reports(db, teacher_email=teacher_email, status=status,
                       class_name=class_name, date_from=date_from,
                       date_to=date_to, search=search, skip=skip, limit=limit)


@router.get("/{report_id}", response_model=TeachingReportOut)
def get_report_by_id(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    report = get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    # Teachers can only view their own
    if current_user.role == RoleEnum.teacher and report.teacher_email != current_user.email:
        raise HTTPException(status_code=403, detail="Access denied")
    return report


@router.post("/", response_model=TeachingReportOut, status_code=status.HTTP_201_CREATED)
def create_new_report(
    data: TeachingReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    teacher_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
    return create_report(db, data, teacher_email=current_user.email, teacher_name=teacher_name)


@router.put("/{report_id}", response_model=TeachingReportOut)
def update_report_endpoint(
    report_id: int,
    data: TeachingReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    report = get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if current_user.role == RoleEnum.teacher and report.teacher_email != current_user.email:
        raise HTTPException(status_code=403, detail="Access denied")
    if report.status not in ("draft", "rejected"):
        raise HTTPException(status_code=400, detail="Only draft or rejected reports can be edited")
    return update_report(db, report, data)


@router.post("/{report_id}/submit", response_model=TeachingReportOut)
def submit_report_endpoint(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    report = get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if current_user.role == RoleEnum.teacher and report.teacher_email != current_user.email:
        raise HTTPException(status_code=403, detail="Access denied")
    if report.status not in ("draft", "rejected"):
        raise HTTPException(status_code=400, detail="Report cannot be submitted in its current state")
    return submit_report(db, report)


@router.post("/{report_id}/review", response_model=TeachingReportOut)
def review_report_endpoint(
    report_id: int,
    data: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role not in REVIEWER_ROLES:
        raise HTTPException(status_code=403, detail="Only principals or admins can review reports")
    report = get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "submitted":
        raise HTTPException(status_code=400, detail="Only submitted reports can be reviewed")
    if data.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")
    return review_report(db, report, data, reviewer_email=current_user.email)


@router.delete("/{report_id}")
def delete_report_endpoint(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    report = get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if current_user.role == RoleEnum.teacher and report.teacher_email != current_user.email:
        raise HTTPException(status_code=403, detail="Access denied")
    if report.status == "approved":
        raise HTTPException(status_code=400, detail="Approved reports cannot be deleted")
    delete_report(db, report)
    return {"message": "Deleted"}
