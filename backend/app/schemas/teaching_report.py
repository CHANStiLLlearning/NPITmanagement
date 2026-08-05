from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime
from app.models.teaching_report import ReportStatus


class AttachmentItem(BaseModel):
    name: str
    file_type: str   # pdf | image | pptx | docx
    url: str         # base64 data URL or file path


class TeachingReportBase(BaseModel):
    report_date: date
    class_name: Optional[str] = None
    subject: Optional[str] = None
    lesson_title: Optional[str] = None
    lesson_objective: Optional[str] = None
    teaching_method: Optional[str] = None
    activities: Optional[str] = None
    homework: Optional[str] = None
    student_participation: Optional[str] = None
    problems_faced: Optional[str] = None
    solutions_applied: Optional[str] = None
    next_lesson_plan: Optional[str] = None
    attachments: Optional[List[Any]] = []


class TeachingReportCreate(TeachingReportBase):
    status: ReportStatus = ReportStatus.draft


class TeachingReportUpdate(BaseModel):
    report_date: Optional[date] = None
    class_name: Optional[str] = None
    subject: Optional[str] = None
    lesson_title: Optional[str] = None
    lesson_objective: Optional[str] = None
    teaching_method: Optional[str] = None
    activities: Optional[str] = None
    homework: Optional[str] = None
    student_participation: Optional[str] = None
    problems_faced: Optional[str] = None
    solutions_applied: Optional[str] = None
    next_lesson_plan: Optional[str] = None
    attachments: Optional[List[Any]] = None
    status: Optional[ReportStatus] = None


class ApprovalRequest(BaseModel):
    action: str       # "approve" | "reject"
    review_note: Optional[str] = None


class TeachingReportOut(TeachingReportBase):
    id: int
    teacher_email: str
    teacher_name: str
    status: ReportStatus
    submitted_at: Optional[datetime]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    review_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
