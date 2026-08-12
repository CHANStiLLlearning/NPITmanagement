import io
import csv
from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.attendance import AttendanceRecord
from app.models.teaching_report import TeachingReport
from app.models.score import ScoreCategory, StudentScore, ReportCard
from app.crud.audit_log import log_action

router = APIRouter()


from datetime import date, datetime, timedelta

@router.get("/summary")
def get_school_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    total_students = db.query(Student).filter(Student.is_active == True).count()
    total_teachers = db.query(Teacher).filter(Teacher.status == "active").count()
    if total_teachers == 0:
        total_teachers = db.query(Teacher).count()

    role_str = getattr(current_user.role, 'value', str(current_user.role)).lower()
    student_sid = None
    if role_str == "student":
        st = db.query(Student).filter(Student.email == current_user.email).first()
        if not st and current_user.first_name:
            st = db.query(Student).filter(Student.first_name.ilike(f"%{current_user.first_name}%")).first()
        student_sid = st.student_id if st else "NO_MATCHING_STUDENT"
        
    att_q = db.query(AttendanceRecord)
    if student_sid:
        att_q = att_q.filter(AttendanceRecord.student_sid == student_sid)

    total_att   = att_q.count()
    present_att = att_q.filter(AttendanceRecord.status == "present").count()
    att_rate    = round((present_att / total_att * 100), 1) if total_att > 0 else 0.0

    total_reports  = db.query(TeachingReport).count()
    approved_reports = db.query(TeachingReport).filter(TeachingReport.status == "approved").count()

    total_cards    = db.query(ReportCard).count()
    avg_gpa_res    = db.query(func.avg(ReportCard.gpa)).scalar()
    avg_gpa        = round(float(avg_gpa_res), 2) if avg_gpa_res else 0.0

    # Real class breakdown from database
    class_rows = db.query(Student.class_name, func.count(Student.id)).filter(Student.is_active == True).group_by(Student.class_name).all()
    class_distribution = {c[0] or "Unassigned": c[1] for c in class_rows}

    # Weekly attendance trends (Monday to Friday of current week)
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    day_labels = [
        ("ច័ន្ទ (Mon)", "Mon"),
        ("អង្គារ (Tue)", "Tue"),
        ("ពុធ (Wed)", "Wed"),
        ("ព្រហស្បតិ៍ (Thu)", "Thu"),
        ("សុក្រ (Fri)", "Fri"),
    ]
    weekly_attendance = []
    for idx, (kh_name, en_name) in enumerate(day_labels):
        d = monday + timedelta(days=idx)
        dq = db.query(AttendanceRecord).filter(AttendanceRecord.date == d)
        if student_sid:
            dq = dq.filter(AttendanceRecord.student_sid == student_sid)
        p = dq.filter(AttendanceRecord.status == "present").count()
        a = dq.filter(AttendanceRecord.status == "absent").count()
        weekly_attendance.append({
            "day": f"{kh_name} ({d.strftime('%d/%m')})",
            "date": d.strftime("%Y-%m-%d"),
            "present": p,
            "absent": a,
        })

    # Score trend by term from real ReportCard data
    term_rows = db.query(
        ReportCard.term,
        func.avg(ReportCard.weighted_total).label("avg_score"),
        func.count(ReportCard.id).label("count"),
    ).group_by(ReportCard.term).order_by(ReportCard.term).all()

    TERM_ORDER = ["Term 1", "Term 2", "Semester 1", "Term 3", "Term 4", "Semester 2", "Final"]
    score_trend = []
    if term_rows:
        # Sort by common term order if possible
        def term_sort_key(r):
            try: return TERM_ORDER.index(r.term)
            except ValueError: return 99
        sorted_rows = sorted(term_rows, key=term_sort_key)
        for r in sorted_rows:
            if r.avg_score is not None:
                score_trend.append({
                    "term": r.term or "Unknown",
                    "avg_score": round(float(r.avg_score), 1),
                    "count": r.count,
                })

    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "attendance_rate": att_rate,
        "total_attendance_scans": total_att,
        "teaching_reports_count": total_reports,
        "approved_teaching_reports": approved_reports,
        "report_cards_count": total_cards,
        "average_gpa": avg_gpa,
        "class_distribution": class_distribution,
        "weekly_attendance": weekly_attendance,
        "score_trend": score_trend,
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    }



@router.get("/export/{report_type}/csv")
def export_report_csv(
    report_type: str,
    class_name: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    output = io.StringIO()
    writer = csv.writer(output)

    # Log action
    log_action(
        db,
        user_email=current_user.email,
        action="export",
        module="Reports Center",
        details=f"Exported {report_type} report to CSV",
    )

    if report_type == "attendance":
        q = db.query(AttendanceRecord)
        if class_name: q = q.filter(AttendanceRecord.class_name == class_name)
        if from_date:  q = q.filter(AttendanceRecord.date >= from_date)
        if to_date:    q = q.filter(AttendanceRecord.date <= to_date)
        records = q.all()
        writer.writerow(["Student ID", "Student Name", "Class", "Section", "Date", "Time In", "Status", "Method", "Scanned By"])
        for r in records:
            writer.writerow([r.student_sid, r.student_name, r.class_name, r.section, r.date, r.time_in, r.status, r.scan_method, r.scanned_by])

    elif report_type == "teachers":
        teachers = db.query(Teacher).all()
        writer.writerow(["Teacher ID", "Full Name", "Email", "Department", "Qualification", "Status", "Rating"])
        for t in teachers:
            writer.writerow([t.teacher_id, f"{t.first_name} {t.last_name}", t.email, t.department, t.qualification, t.status, t.performance_rating])

    elif report_type == "students":
        q = db.query(Student)
        if class_name: q = q.filter(Student.class_name == class_name)
        students = q.all()
        writer.writerow(["Student ID", "Full Name", "Class", "Section", "Email", "Guardian Name", "Guardian Phone", "Status"])
        for s in students:
            writer.writerow([s.student_id, f"{s.first_name} {s.last_name}", s.class_name, s.section, s.email, s.guardian_name, s.guardian_phone, "Active" if s.is_active else "Inactive"])

    elif report_type == "teaching-reports":
        q = db.query(TeachingReport)
        if class_name: q = q.filter(TeachingReport.class_name == class_name)
        reports = q.all()
        writer.writerow(["ID", "Date", "Teacher", "Class", "Subject", "Lesson Title", "Status", "Reviewed By"])
        for tr in reports:
            writer.writerow([tr.id, tr.report_date, tr.teacher_name, tr.class_name, tr.subject, tr.lesson_title, tr.status, tr.reviewed_by])

    elif report_type == "scores" or report_type == "report-cards":
        q = db.query(ReportCard)
        if class_name: q = q.filter(ReportCard.class_name == class_name)
        cards = q.all()
        writer.writerow(["Student ID", "Student Name", "Class", "Subject", "Term", "Weighted Score %", "Grade", "GPA", "Rank"])
        for c in cards:
            writer.writerow([c.student_sid, c.student_name, c.class_name, c.subject, c.term, c.weighted_total, c.letter_grade, c.gpa, c.rank])

    elif report_type == "school-summary":
        summary = get_school_summary(db=db, current_user=current_user)
        writer.writerow(["Metric", "Value"])
        for k, v in summary.items():
            writer.writerow([k.replace("_", " ").title(), v])

    else:
        raise HTTPException(status_code=400, detail=f"Invalid report type '{report_type}'")

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={report_type}_report.csv"},
    )
