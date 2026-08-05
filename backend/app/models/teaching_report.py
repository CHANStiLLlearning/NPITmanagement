import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Text, Enum, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class ReportStatus(str, enum.Enum):
    draft     = "draft"
    submitted = "submitted"
    approved  = "approved"
    rejected  = "rejected"


class TeachingReport(Base):
    __tablename__ = "teaching_reports"

    id = Column(Integer, primary_key=True, index=True)

    # Ownership
    teacher_email = Column(String(200), nullable=False, index=True)
    teacher_name  = Column(String(200), nullable=False)

    # Core fields
    report_date        = Column(Date, nullable=False, index=True)
    class_name         = Column(String(50), nullable=True)
    subject            = Column(String(100), nullable=True)
    lesson_title       = Column(String(300), nullable=True)
    lesson_objective   = Column(Text, nullable=True)
    teaching_method    = Column(String(200), nullable=True)
    activities         = Column(Text, nullable=True)
    homework           = Column(Text, nullable=True)
    student_participation = Column(Text, nullable=True)
    problems_faced     = Column(Text, nullable=True)
    solutions_applied  = Column(Text, nullable=True)
    next_lesson_plan   = Column(Text, nullable=True)

    # Attachments stored as JSON list of {name, type, url/base64}
    attachments        = Column(JSON, default=list)

    # Workflow
    status             = Column(Enum(ReportStatus), default=ReportStatus.draft, index=True)
    submitted_at       = Column(DateTime, nullable=True)
    reviewed_by        = Column(String(200), nullable=True)   # principal email
    reviewed_at        = Column(DateTime, nullable=True)
    review_note        = Column(Text, nullable=True)

    created_at         = Column(DateTime, default=datetime.utcnow)
    updated_at         = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
