from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.score import ScoreCategoryType


# ── Category ──────────────────────────────────────────
class ScoreCategoryCreate(BaseModel):
    name: str
    category_type: ScoreCategoryType
    weight_percent: float
    max_score: float = 100.0
    class_name: Optional[str] = None
    subject: Optional[str] = None
    term: Optional[str] = "Term 1"
    description: Optional[str] = None


class ScoreCategoryUpdate(BaseModel):
    name: Optional[str] = None
    weight_percent: Optional[float] = None
    max_score: Optional[float] = None
    description: Optional[str] = None


class ScoreCategoryOut(ScoreCategoryCreate):
    id: int
    teacher_email: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Student Score ──────────────────────────────────────
class StudentScoreUpsert(BaseModel):
    student_sid: str
    score: Optional[float] = None
    teacher_comment: Optional[str] = None


class StudentScoreOut(BaseModel):
    id: int
    student_id: int
    student_sid: str
    student_name: str
    class_name: Optional[str]
    category_id: int
    score: Optional[float]
    teacher_comment: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Calculated result ──────────────────────────────────
class StudentResult(BaseModel):
    student_sid: str
    student_name: str
    class_name: Optional[str]
    scores: dict          # {category_id: score}
    weighted_total: float
    letter_grade: str
    gpa: float
    rank: Optional[int] = None


# ── Report Card ────────────────────────────────────────
class ReportCardUpdate(BaseModel):
    teacher_comment: Optional[str] = None
    principal_comment: Optional[str] = None
    status: Optional[str] = None


class ReportCardOut(BaseModel):
    id: int
    student_sid: str
    student_name: str
    class_name: Optional[str]
    subject: Optional[str]
    term: Optional[str]
    weighted_total: Optional[float]
    letter_grade: Optional[str]
    gpa: Optional[float]
    rank: Optional[int]
    teacher_comment: Optional[str]
    principal_comment: Optional[str]
    status: str
    published_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
