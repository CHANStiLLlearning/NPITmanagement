import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, Float,
    Text, Enum, DateTime, Numeric, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class ScoreCategoryType(str, enum.Enum):
    assignment  = "assignment"
    quiz        = "quiz"
    midterm     = "midterm"
    final       = "final"
    practical   = "practical"
    project     = "project"
    attendance  = "attendance"
    behavior    = "behavior"
    custom      = "custom"


class ScoreCategory(Base):
    """Defines a score component for a class/subject with a weight."""
    __tablename__ = "score_categories"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(200), nullable=False)
    category_type   = Column(Enum(ScoreCategoryType), nullable=False)
    weight_percent  = Column(Float, nullable=False, default=0.0)   # e.g. 20.0 → 20%
    max_score       = Column(Float, nullable=False, default=100.0)
    class_name      = Column(String(50), nullable=True)
    subject         = Column(String(100), nullable=True)
    term            = Column(String(50), nullable=True, default="Term 1")
    teacher_email   = Column(String(200), nullable=True)
    description     = Column(Text, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

    scores = relationship("StudentScore", back_populates="category", cascade="all, delete-orphan")


class StudentScore(Base):
    """A single student's score for one category."""
    __tablename__ = "student_scores"

    __table_args__ = (
        UniqueConstraint("student_sid", "category_id", name="uq_student_category"),
    )

    id           = Column(Integer, primary_key=True, index=True)
    student_id   = Column(Integer, ForeignKey("students.id"), nullable=False)
    student_sid  = Column(String(20), nullable=False, index=True)
    student_name = Column(String(200), nullable=False)
    class_name   = Column(String(50), nullable=True)
    category_id  = Column(Integer, ForeignKey("score_categories.id"), nullable=False)
    score        = Column(Float, nullable=True)          # None = not yet graded
    teacher_comment = Column(Text, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("ScoreCategory", back_populates="scores")
    student  = relationship("Student", backref="scores")


class ReportCard(Base):
    """Aggregated report card per student per term."""
    __tablename__ = "report_cards"

    __table_args__ = (
        UniqueConstraint("student_sid", "class_name", "subject", "term", name="uq_report_card"),
    )

    id               = Column(Integer, primary_key=True, index=True)
    student_id       = Column(Integer, ForeignKey("students.id"), nullable=False)
    student_sid      = Column(String(20), nullable=False, index=True)
    student_name     = Column(String(200), nullable=False)
    class_name       = Column(String(50), nullable=True)
    subject          = Column(String(100), nullable=True)
    term             = Column(String(50), nullable=True)
    weighted_total   = Column(Float, nullable=True)   # 0–100
    letter_grade     = Column(String(5), nullable=True)
    gpa              = Column(Float, nullable=True)
    rank             = Column(Integer, nullable=True)
    teacher_comment  = Column(Text, nullable=True)
    principal_comment = Column(Text, nullable=True)
    status           = Column(String(20), default="draft")  # draft | published
    published_at     = Column(DateTime, nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", backref="report_cards")
