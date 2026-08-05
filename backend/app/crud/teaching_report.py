from datetime import datetime, date
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.teaching_report import TeachingReport, ReportStatus
from app.schemas.teaching_report import (
    TeachingReportCreate, TeachingReportUpdate, ApprovalRequest,
)


def create_report(
    db: Session, data: TeachingReportCreate, teacher_email: str, teacher_name: str
) -> TeachingReport:
    report = TeachingReport(
        **data.model_dump(),
        teacher_email=teacher_email,
        teacher_name=teacher_name,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_report(db: Session, report_id: int) -> TeachingReport | None:
    return db.query(TeachingReport).filter(TeachingReport.id == report_id).first()


def get_reports(
    db: Session,
    teacher_email: Optional[str] = None,
    status: Optional[str] = None,
    class_name: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[TeachingReport]:
    query = db.query(TeachingReport)
    if teacher_email:
        query = query.filter(TeachingReport.teacher_email == teacher_email)
    if status:
        query = query.filter(TeachingReport.status == status)
    if class_name:
        query = query.filter(TeachingReport.class_name == class_name)
    if date_from:
        query = query.filter(TeachingReport.report_date >= date_from)
    if date_to:
        query = query.filter(TeachingReport.report_date <= date_to)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                TeachingReport.lesson_title.ilike(term),
                TeachingReport.subject.ilike(term),
                TeachingReport.teacher_name.ilike(term),
                TeachingReport.class_name.ilike(term),
            )
        )
    return query.order_by(TeachingReport.report_date.desc()).offset(skip).limit(limit).all()


def update_report(db: Session, report: TeachingReport, data: TeachingReportUpdate) -> TeachingReport:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(report, k, v)
    db.commit()
    db.refresh(report)
    return report


def submit_report(db: Session, report: TeachingReport) -> TeachingReport:
    report.status = ReportStatus.submitted
    report.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    return report


def review_report(db: Session, report: TeachingReport, action: ApprovalRequest, reviewer_email: str) -> TeachingReport:
    report.status = ReportStatus.approved if action.action == "approve" else ReportStatus.rejected
    report.reviewed_by = reviewer_email
    report.reviewed_at = datetime.utcnow()
    report.review_note = action.review_note
    db.commit()
    db.refresh(report)
    return report


def delete_report(db: Session, report: TeachingReport):
    db.delete(report)
    db.commit()
