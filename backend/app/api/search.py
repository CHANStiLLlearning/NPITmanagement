from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Dict, Any

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, RoleEnum
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.attendance import AttendanceRecord
from app.models.teaching_report import TeachingReport
from app.models.score import ScoreCategory, StudentScore, ReportCard
from app.models.academic import Grade, Section, Subject

router = APIRouter()


@router.get("/")
def global_search(
    q: str = Query(..., min_length=1, description="Search query string"),
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    term = f"%{q.strip()}%"

    results: Dict[str, List[Dict[str, Any]]] = {
        "students": [],
        "teachers": [],
        "parents": [],
        "attendance": [],
        "teaching_reports": [],
        "scores": [],
        "classes": [],
        "subjects": [],
    }

    # 1. Search Students
    student_matches = db.query(Student).filter(
        or_(
            Student.first_name.ilike(term),
            Student.last_name.ilike(term),
            Student.student_id.ilike(term),
            Student.class_name.ilike(term),
            Student.email.ilike(term),
            Student.phone.ilike(term),
            Student.guardian_name.ilike(term),
        )
    ).limit(limit).all()

    for s in student_matches:
        results["students"].append({
            "id": s.id,
            "title": f"{s.first_name} {s.last_name}",
            "subtitle": f"{s.student_id} · {s.class_name or 'No Class'} · Guardian: {s.guardian_name or 'N/A'}",
            "link": "/students",
            "type": "student",
        })

    # 2. Search Teachers
    teacher_matches = db.query(Teacher).filter(
        or_(
            Teacher.first_name.ilike(term),
            Teacher.last_name.ilike(term),
            Teacher.teacher_id.ilike(term),
            Teacher.department.ilike(term),
            Teacher.email.ilike(term),
            Teacher.qualification.ilike(term),
        )
    ).limit(limit).all()

    for t in teacher_matches:
        results["teachers"].append({
            "id": t.id,
            "title": f"{t.first_name} {t.last_name}",
            "subtitle": f"{t.teacher_id} · Dept: {t.department or 'N/A'} · {t.qualification or ''}",
            "link": "/teachers",
            "type": "teacher",
        })

    # 3. Search Parents / Guardians (Derived from Student guardian fields + Users with parent role)
    parent_user_matches = db.query(User).filter(
        User.role == RoleEnum.parent,
        or_(
            User.first_name.ilike(term),
            User.last_name.ilike(term),
            User.email.ilike(term),
        )
    ).limit(limit).all()

    for pu in parent_user_matches:
        results["parents"].append({
            "id": pu.id,
            "title": f"{pu.first_name or ''} {pu.last_name or ''}".strip() or pu.email,
            "subtitle": f"Parent Account · {pu.email}",
            "link": "/users",
            "type": "parent",
        })

    # 4. Search Attendance Records
    attendance_matches = db.query(AttendanceRecord).filter(
        or_(
            AttendanceRecord.student_name.ilike(term),
            AttendanceRecord.student_sid.ilike(term),
            AttendanceRecord.class_name.ilike(term),
            AttendanceRecord.status.ilike(term),
        )
    ).order_by(AttendanceRecord.date.desc()).limit(limit).all()

    for a in attendance_matches:
        results["attendance"].append({
            "id": a.id,
            "title": f"{a.student_name} ({a.status.value.upper()})",
            "subtitle": f"Date: {a.date} · Class: {a.class_name or 'N/A'} · Time: {a.time_in or 'N/A'}",
            "link": "/attendance",
            "type": "attendance",
        })

    # 5. Search Teaching Reports
    report_matches = db.query(TeachingReport).filter(
        or_(
            TeachingReport.lesson_title.ilike(term),
            TeachingReport.subject.ilike(term),
            TeachingReport.teacher_name.ilike(term),
            TeachingReport.class_name.ilike(term),
            TeachingReport.lesson_objective.ilike(term),
        )
    ).order_by(TeachingReport.report_date.desc()).limit(limit).all()

    for tr in report_matches:
        results["teaching_reports"].append({
            "id": tr.id,
            "title": tr.lesson_title or "Teaching Log",
            "subtitle": f"By {tr.teacher_name} · {tr.subject or ''} · {tr.class_name or ''} ({tr.report_date})",
            "link": "/teaching-reports",
            "type": "teaching_report",
        })

    # 6. Search Scores / Report Cards
    score_matches = db.query(ReportCard).filter(
        or_(
            ReportCard.student_name.ilike(term),
            ReportCard.student_sid.ilike(term),
            ReportCard.subject.ilike(term),
            ReportCard.class_name.ilike(term),
            ReportCard.letter_grade.ilike(term),
        )
    ).limit(limit).all()

    for sc in score_matches:
        results["scores"].append({
            "id": sc.id,
            "title": f"{sc.student_name} — Score: {round(sc.weighted_total or 0, 1)}% ({sc.letter_grade or 'N/A'})",
            "subtitle": f"Subject: {sc.subject or 'General'} · Class: {sc.class_name or ''} · Rank #{sc.rank or '-'}",
            "link": "/scores",
            "type": "score",
        })

    # 7. Search Classes & Grades
    grade_matches = db.query(Grade).filter(
        or_(
            Grade.name.ilike(term),
            Grade.description.ilike(term),
        )
    ).limit(limit).all()

    for g in grade_matches:
        results["classes"].append({
            "id": g.id,
            "title": g.name,
            "subtitle": f"Grade Level {g.level} · {len(g.sections)} Sections",
            "link": "/classes",
            "type": "class",
        })

    # 8. Search Subjects
    subject_matches = db.query(Subject).filter(
        or_(
            Subject.name.ilike(term),
            Subject.code.ilike(term),
            Subject.type.ilike(term),
        )
    ).limit(limit).all()

    for sub in subject_matches:
        results["subjects"].append({
            "id": sub.id,
            "title": f"{sub.name} ({sub.code})",
            "subtitle": f"Type: {sub.type} Subject",
            "link": "/subjects",
            "type": "subject",
        })

    # Calculate total match count across all categories
    total_count = sum(len(items) for items in results.values())

    return {
        "query": q,
        "total_results": total_count,
        "categories": results,
    }
