from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, RoleEnum
from app.models.exam import ExamType, Exam, ExamSchedule, ExamMark
from pydantic import BaseModel

router = APIRouter()

class ExamTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    weight_percentage: float = 100.0

class ExamCreate(BaseModel):
    exam_type_id: int
    name: str
    academic_year: str = "2025-2026"
    term_name: str = "Semester 1"
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ExamMarkCreate(BaseModel):
    exam_id: int
    student_id: int
    subject_id: int
    score: float
    grade: Optional[str] = None
    remarks: Optional[str] = None

@router.get("/types")
def list_exam_types(db: Session = Depends(get_db)):
    return db.query(ExamType).all()

@router.post("/types")
def create_exam_type(payload: ExamTypeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    t = ExamType(name=payload.name, description=payload.description, weight_percentage=payload.weight_percentage)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@router.get("/")
def list_exams(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    exams = db.query(Exam).order_by(Exam.created_at.desc()).all()
    results = []
    for ex in exams:
        results.append({
            "id": ex.id,
            "name": ex.name,
            "exam_type": ex.exam_type.name if ex.exam_type else "N/A",
            "academic_year": ex.academic_year,
            "term_name": ex.term_name,
            "start_date": ex.start_date.strftime("%Y-%m-%d") if ex.start_date else "",
            "end_date": ex.end_date.strftime("%Y-%m-%d") if ex.end_date else "",
            "is_published": ex.is_published,
            "total_marks_recorded": len(ex.marks),
            "schedules_count": len(ex.schedules)
        })
    return results

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_exam(payload: ExamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ex = Exam(
        exam_type_id=payload.exam_type_id,
        name=payload.name,
        academic_year=payload.academic_year,
        term_name=payload.term_name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_published=1
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex

@router.post("/marks")
def enter_exam_mark(payload: ExamMarkCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    mark = ExamMark(
        exam_id=payload.exam_id,
        student_id=payload.student_id,
        subject_id=payload.subject_id,
        score=payload.score,
        grade=payload.grade,
        remarks=payload.remarks,
        entered_by=f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email
    )
    db.add(mark)
    db.commit()
    db.refresh(mark)
    return mark
