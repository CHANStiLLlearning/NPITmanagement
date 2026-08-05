from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import time, datetime

from app.db.session import get_db
from app.models.academic import (
    AcademicYear, Semester, Grade, Section, Subject,
    TeacherAssignment, TimetableEntry, Holiday
)
from app.schemas.academic import (
    AcademicYearCreate, AcademicYearOut,
    SemesterCreate, SemesterOut,
    GradeCreate, GradeOut,
    SectionCreate, SectionOut,
    SubjectCreate, SubjectOut,
    TeacherAssignmentCreate, TeacherAssignmentOut,
    TimetableEntryCreate, TimetableEntryOut,
    HolidayCreate, HolidayOut,
)
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

# ── Academic Year Endpoints ──
@router.get("/academic-years", response_model=List[AcademicYearOut])
def list_academic_years(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(AcademicYear).order_by(AcademicYear.start_date.desc()).all()

@router.post("/academic-years", response_model=AcademicYearOut, status_code=201)
def create_academic_year(data: AcademicYearCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if data.is_current:
        db.query(AcademicYear).update({"is_current": False})
    ay = AcademicYear(**data.model_dump())
    db.add(ay)
    db.commit()
    db.refresh(ay)
    return ay

@router.delete("/academic-years/{id}")
def delete_academic_year(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ay = db.query(AcademicYear).filter(AcademicYear.id == id).first()
    if not ay:
        raise HTTPException(404, "Academic Year not found")
    db.delete(ay)
    db.commit()
    return {"message": "Deleted"}


# ── Semester Endpoints ──
@router.get("/semesters", response_model=List[SemesterOut])
def list_semesters(academic_year_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    q = db.query(Semester)
    if academic_year_id:
        q = q.filter(Semester.academic_year_id == academic_year_id)
    return q.order_by(Semester.start_date.asc()).all()

@router.post("/semesters", response_model=SemesterOut, status_code=201)
def create_semester(data: SemesterCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if data.is_current:
        db.query(Semester).update({"is_current": False})
    sem = Semester(**data.model_dump())
    db.add(sem)
    db.commit()
    db.refresh(sem)
    return sem

@router.delete("/semesters/{id}")
def delete_semester(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    sem = db.query(Semester).filter(Semester.id == id).first()
    if not sem:
        raise HTTPException(404, "Semester not found")
    db.delete(sem)
    db.commit()
    return {"message": "Deleted"}


# ── Grade & Section Endpoints ──
@router.get("/grades", response_model=List[GradeOut])
def list_grades(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Grade).order_by(Grade.level.asc()).all()

@router.post("/grades", response_model=GradeOut, status_code=201)
def create_grade(data: GradeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    gr = Grade(**data.model_dump())
    db.add(gr)
    db.commit()
    db.refresh(gr)
    return gr

@router.delete("/grades/{id}")
def delete_grade(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    gr = db.query(Grade).filter(Grade.id == id).first()
    if not gr:
        raise HTTPException(404, "Grade not found")
    db.delete(gr)
    db.commit()
    return {"message": "Deleted"}

@router.post("/sections", response_model=SectionOut, status_code=201)
def create_section(data: SectionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    sec = Section(**data.model_dump())
    db.add(sec)
    db.commit()
    db.refresh(sec)
    return sec

@router.delete("/sections/{id}")
def delete_section(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    sec = db.query(Section).filter(Section.id == id).first()
    if not sec:
        raise HTTPException(404, "Section not found")
    db.delete(sec)
    db.commit()
    return {"message": "Deleted"}


# ── Subject Endpoints ──
@router.get("/subjects", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Subject).order_by(Subject.name.asc()).all()

@router.post("/subjects", response_model=SubjectOut, status_code=201)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    sub = Subject(**data.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@router.delete("/subjects/{id}")
def delete_subject(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    sub = db.query(Subject).filter(Subject.id == id).first()
    if not sub:
        raise HTTPException(404, "Subject not found")
    db.delete(sub)
    db.commit()
    return {"message": "Deleted"}


# ── Teacher Assignment Endpoints ──
@router.get("/teacher-assignments", response_model=List[TeacherAssignmentOut])
def list_teacher_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    assignments = db.query(TeacherAssignment).all()
    res = []
    for a in assignments:
        item = TeacherAssignmentOut(
            id=a.id,
            teacher_email=a.teacher_email,
            teacher_name=a.teacher_name,
            subject_id=a.subject_id,
            grade_id=a.grade_id,
            section_id=a.section_id,
            academic_year=a.academic_year,
            subject_name=a.subject.name if a.subject else None,
            grade_name=a.grade.name if a.grade else None,
            section_name=a.section.name if a.section else None,
        )
        res.append(item)
    return res

@router.post("/teacher-assignments", response_model=TeacherAssignmentOut, status_code=201)
def create_teacher_assignment(data: TeacherAssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ta = TeacherAssignment(**data.model_dump())
    db.add(ta)
    db.commit()
    db.refresh(ta)
    return TeacherAssignmentOut(
        id=ta.id,
        teacher_email=ta.teacher_email,
        teacher_name=ta.teacher_name,
        subject_id=ta.subject_id,
        grade_id=ta.grade_id,
        section_id=ta.section_id,
        academic_year=ta.academic_year,
        subject_name=ta.subject.name if ta.subject else None,
        grade_name=ta.grade.name if ta.grade else None,
        section_name=ta.section.name if ta.section else None,
    )

@router.delete("/teacher-assignments/{id}")
def delete_teacher_assignment(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ta = db.query(TeacherAssignment).filter(TeacherAssignment.id == id).first()
    if not ta:
        raise HTTPException(404, "Assignment not found")
    db.delete(ta)
    db.commit()
    return {"message": "Deleted"}


# ── Timetable Endpoints ──
@router.get("/timetable", response_model=List[TimetableEntryOut])
def list_timetable(grade_id: Optional[int] = None, section_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    q = db.query(TimetableEntry)
    if grade_id:
        q = q.filter(TimetableEntry.grade_id == grade_id)
    if section_id:
        q = q.filter(TimetableEntry.section_id == section_id)
    entries = q.order_by(TimetableEntry.period_number.asc()).all()
    res = []
    for e in entries:
        res.append(TimetableEntryOut(
            id=e.id,
            day_of_week=e.day_of_week,
            period_number=e.period_number,
            start_time=e.start_time.strftime("%H:%M"),
            end_time=e.end_time.strftime("%H:%M"),
            grade_id=e.grade_id,
            section_id=e.section_id,
            subject_id=e.subject_id,
            teacher_name=e.teacher_name,
            room_number=e.room_number,
            subject_name=e.subject.name if e.subject else None,
            grade_name=e.grade.name if e.grade else None,
            section_name=e.section.name if e.section else None,
        ))
    return res

@router.post("/timetable", response_model=TimetableEntryOut, status_code=201)
def create_timetable_entry(data: TimetableEntryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    st = datetime.strptime(data.start_time, "%H:%M").time()
    et = datetime.strptime(data.end_time, "%H:%M").time()
    te = TimetableEntry(
        day_of_week=data.day_of_week,
        period_number=data.period_number,
        start_time=st,
        end_time=et,
        grade_id=data.grade_id,
        section_id=data.section_id,
        subject_id=data.subject_id,
        teacher_name=data.teacher_name,
        room_number=data.room_number,
    )
    db.add(te)
    db.commit()
    db.refresh(te)
    return TimetableEntryOut(
        id=te.id,
        day_of_week=te.day_of_week,
        period_number=te.period_number,
        start_time=te.start_time.strftime("%H:%M"),
        end_time=te.end_time.strftime("%H:%M"),
        grade_id=te.grade_id,
        section_id=te.section_id,
        subject_id=te.subject_id,
        teacher_name=te.teacher_name,
        room_number=te.room_number,
        subject_name=te.subject.name if te.subject else None,
        grade_name=te.grade.name if te.grade else None,
        section_name=te.section.name if te.section else None,
    )

@router.delete("/timetable/{id}")
def delete_timetable_entry(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    te = db.query(TimetableEntry).filter(TimetableEntry.id == id).first()
    if not te:
        raise HTTPException(404, "Timetable entry not found")
    db.delete(te)
    db.commit()
    return {"message": "Deleted"}


# ── Holiday Calendar Endpoints ──
@router.get("/holidays", response_model=List[HolidayOut])
def list_holidays(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Holiday).order_by(Holiday.start_date.asc()).all()

@router.post("/holidays", response_model=HolidayOut, status_code=201)
def create_holiday(data: HolidayCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    h = Holiday(**data.model_dump())
    db.add(h)
    db.commit()
    db.refresh(h)
    return h

@router.delete("/holidays/{id}")
def delete_holiday(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    h = db.query(Holiday).filter(Holiday.id == id).first()
    if not h:
        raise HTTPException(404, "Holiday not found")
    db.delete(h)
    db.commit()
    return {"message": "Deleted"}
